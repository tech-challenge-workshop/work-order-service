import { Inject, Injectable } from '@nestjs/common'
import { WORK_ORDER_REPOSITORY } from '../../work-orders/application/ports/work-order.repository'
import type { WorkOrderRepository } from '../../work-orders/application/ports/work-order.repository'
import { WorkOrder } from '../../work-orders/domain/work-order.entity'
import { MESSAGE_BUS } from '../../../shared/messaging/message-bus'
import type { MessageBus } from '../../../shared/messaging/message-bus'
import { NOTIFICATION_PORT } from '../../../shared/notifications/notification.port'
import type { NotificationPort } from '../../../shared/notifications/notification.port'
import { TRACING_PORT } from '../../../shared/observability/tracing.port'
import type { TracingPort } from '../../../shared/observability/tracing.port'
import { SagaInstance } from '../domain/saga-instance.entity'
import {
  SagaMessage,
  WorkOrderOpenedPayload,
  WorkOrderRefPayload,
} from '../../../shared/messaging/saga-messages'
import { SAGA_INSTANCE_REPOSITORY } from './ports/saga-instance.repository'
import type { SagaInstanceRepository } from './ports/saga-instance.repository'

@Injectable()
export class WorkOrderSagaOrchestrator {
  constructor(
    @Inject(SAGA_INSTANCE_REPOSITORY)
    private readonly sagas: SagaInstanceRepository,
    @Inject(WORK_ORDER_REPOSITORY)
    private readonly workOrders: WorkOrderRepository,
    @Inject(MESSAGE_BUS)
    private readonly publisher: MessageBus,
    @Inject(NOTIFICATION_PORT)
    private readonly notifier: NotificationPort,
    @Inject(TRACING_PORT)
    private readonly tracing: TracingPort,
  ) {}

  onWorkOrderOpened(payload: WorkOrderOpenedPayload): Promise<void> {
    return this.tracing.withSpan(
      'saga.work_order_opened',
      { work_order_id: payload.workOrderId },
      async () => {
        const existing = await this.sagas.findByWorkOrderId(payload.workOrderId)
        if (existing) {
          return
        }

        const saga = SagaInstance.start(payload.workOrderId)
        await this.sagas.create(saga)

        await this.publisher.publish(SagaMessage.ReserveParts, {
          workOrderId: payload.workOrderId,
          parts: payload.parts,
        })
      },
    )
  }

  onPartsReserved(payload: WorkOrderRefPayload): Promise<void> {
    return this.tracing.withSpan(
      'saga.parts_reserved',
      { work_order_id: payload.workOrderId },
      async () => {
        const saga = await this.runningSaga(payload.workOrderId)
        if (!saga || saga.partsReserved) {
          return
        }

        saga.markPartsReserved()
        const workOrder = await this.transition(payload.workOrderId, (order) =>
          order.startDiagnosis(),
        )
        await this.sagas.update(saga)

        await this.publisher.publish(SagaMessage.GenerateQuote, {
          workOrderId: payload.workOrderId,
          totalCents: workOrder.totalCents,
        })
      },
    )
  }

  onPartsReservationFailed(payload: WorkOrderRefPayload): Promise<void> {
    return this.compensate(payload.workOrderId)
  }

  onQuoteGenerated(payload: WorkOrderRefPayload): Promise<void> {
    return this.tracing.withSpan(
      'saga.quote_generated',
      { work_order_id: payload.workOrderId },
      async () => {
        const saga = await this.runningSaga(payload.workOrderId)
        if (!saga || saga.quoteGenerated) {
          return
        }

        saga.markQuoteGenerated()
        await this.transition(payload.workOrderId, (order) => order.requestApproval())
        await this.sagas.update(saga)
      },
    )
  }

  onQuoteApproved(payload: WorkOrderRefPayload): Promise<void> {
    return this.tracing.withSpan(
      'saga.quote_approved',
      { work_order_id: payload.workOrderId },
      async () => {
        const saga = await this.runningSaga(payload.workOrderId)
        if (!saga || saga.paymentConfirmed) {
          return
        }

        saga.markPaymentRequested()
        await this.sagas.update(saga)

        await this.publisher.publish(SagaMessage.ConfirmPayment, {
          workOrderId: payload.workOrderId,
        })
      },
    )
  }

  onQuoteRejected(payload: WorkOrderRefPayload): Promise<void> {
    return this.compensate(payload.workOrderId)
  }

  onPaymentConfirmed(payload: WorkOrderRefPayload): Promise<void> {
    return this.tracing.withSpan(
      'saga.payment_confirmed',
      { work_order_id: payload.workOrderId },
      async () => {
        const saga = await this.runningSaga(payload.workOrderId)
        if (!saga || saga.paymentConfirmed) {
          return
        }

        saga.markPaymentConfirmed()
        await this.transition(payload.workOrderId, (order) => order.startExecution())
        await this.sagas.update(saga)

        await this.publisher.publish(SagaMessage.StartExecution, {
          workOrderId: payload.workOrderId,
        })
      },
    )
  }

  onPaymentFailed(payload: WorkOrderRefPayload): Promise<void> {
    return this.compensate(payload.workOrderId)
  }

  onExecutionCompleted(payload: WorkOrderRefPayload): Promise<void> {
    return this.tracing.withSpan(
      'saga.execution_completed',
      { work_order_id: payload.workOrderId },
      async () => {
        const saga = await this.runningSaga(payload.workOrderId)
        if (!saga) {
          return
        }

        await this.transition(payload.workOrderId, (order) => order.finish())
        saga.complete()
        await this.sagas.update(saga)
      },
    )
  }

  onExecutionFailed(payload: WorkOrderRefPayload): Promise<void> {
    return this.compensate(payload.workOrderId)
  }

  private async runningSaga(workOrderId: string): Promise<SagaInstance | null> {
    const saga = await this.sagas.findByWorkOrderId(workOrderId)
    return saga?.isRunning ? saga : null
  }

  private async transition(
    workOrderId: string,
    change: (order: WorkOrder) => void,
  ): Promise<WorkOrder> {
    const workOrder = await this.workOrders.findById(workOrderId)
    if (!workOrder) {
      throw new Error(`Work order not found for saga: ${workOrderId}`)
    }

    const previousStatus = workOrder.status
    change(workOrder)
    await this.workOrders.update(workOrder)

    if (workOrder.status !== previousStatus) {
      const lastChange = workOrder.history[workOrder.history.length - 1]
      await this.notifier.notifyStatusChange({
        workOrderId: workOrder.id,
        customerId: workOrder.customerId,
        previousStatus,
        newStatus: workOrder.status,
        occurredAt: lastChange.changedAt,
      })
    }
    return workOrder
  }

  private compensate(workOrderId: string): Promise<void> {
    return this.tracing.withSpan('saga.compensate', { work_order_id: workOrderId }, async () => {
      const saga = await this.runningSaga(workOrderId)
      if (!saga) {
        return
      }

      if (saga.paymentConfirmed) {
        await this.publisher.publish(SagaMessage.RefundPayment, { workOrderId })
      }
      if (saga.quoteGenerated) {
        await this.publisher.publish(SagaMessage.CancelQuote, { workOrderId })
      }
      if (saga.partsReserved) {
        await this.publisher.publish(SagaMessage.ReleaseParts, { workOrderId })
      }

      await this.transition(workOrderId, (order) => order.cancel())
      saga.cancel()
      await this.sagas.update(saga)
    })
  }
}
