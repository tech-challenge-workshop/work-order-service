import { Inject, Injectable } from '@nestjs/common'
import { WORK_ORDER_REPOSITORY } from '../../work-orders/application/ports/work-order.repository'
import type { WorkOrderRepository } from '../../work-orders/application/ports/work-order.repository'
import { WorkOrder } from '../../work-orders/domain/work-order.entity'
import { MESSAGE_BUS } from '../../../shared/messaging/message-bus'
import type { MessageBus } from '../../../shared/messaging/message-bus'
import { NOTIFICATION_PORT } from '../../../shared/notifications/notification.port'
import type { NotificationPort } from '../../../shared/notifications/notification.port'
import { TRACING_PORT } from '../../../shared/tracing/tracing.port'
import type { TracingPort } from '../../../shared/tracing/tracing.port'
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

  async onWorkOrderOpened(payload: WorkOrderOpenedPayload): Promise<void> {
    const span = this.tracing.startSpan('saga.work_order_opened', {
      work_order_id: payload.workOrderId,
    })
    try {
      const existing = await this.sagas.findByWorkOrderId(payload.workOrderId)
      if (existing) {
        span.finish()
        return
      }

      const saga = SagaInstance.start(payload.workOrderId)
      await this.sagas.create(saga)

      await this.publisher.publish(SagaMessage.ReserveParts, {
        workOrderId: payload.workOrderId,
        parts: payload.parts,
      })
      span.finish()
    } catch (err) {
      span.error(err as Error)
      throw err
    }
  }

  async onPartsReserved(payload: WorkOrderRefPayload): Promise<void> {
    const span = this.tracing.startSpan('saga.parts_reserved', {
      work_order_id: payload.workOrderId,
    })
    try {
      const saga = await this.runningSaga(payload.workOrderId)
      if (!saga || saga.partsReserved) {
        span.finish()
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
      span.finish()
    } catch (err) {
      span.error(err as Error)
      throw err
    }
  }

  async onPartsReservationFailed(payload: WorkOrderRefPayload): Promise<void> {
    await this.compensate(payload.workOrderId)
  }

  async onQuoteGenerated(payload: WorkOrderRefPayload): Promise<void> {
    const span = this.tracing.startSpan('saga.quote_generated', {
      work_order_id: payload.workOrderId,
    })
    try {
      const saga = await this.runningSaga(payload.workOrderId)
      if (!saga || saga.quoteGenerated) {
        span.finish()
        return
      }

      saga.markQuoteGenerated()
      await this.transition(payload.workOrderId, (order) => order.requestApproval())
      await this.sagas.update(saga)
      span.finish()
    } catch (err) {
      span.error(err as Error)
      throw err
    }
  }

  async onQuoteApproved(payload: WorkOrderRefPayload): Promise<void> {
    const span = this.tracing.startSpan('saga.quote_approved', {
      work_order_id: payload.workOrderId,
    })
    try {
      const saga = await this.runningSaga(payload.workOrderId)
      if (!saga || saga.paymentConfirmed) {
        span.finish()
        return
      }

      saga.markPaymentRequested()
      await this.sagas.update(saga)

      await this.publisher.publish(SagaMessage.ConfirmPayment, {
        workOrderId: payload.workOrderId,
      })
      span.finish()
    } catch (err) {
      span.error(err as Error)
      throw err
    }
  }

  async onQuoteRejected(payload: WorkOrderRefPayload): Promise<void> {
    await this.compensate(payload.workOrderId)
  }

  async onPaymentConfirmed(payload: WorkOrderRefPayload): Promise<void> {
    const span = this.tracing.startSpan('saga.payment_confirmed', {
      work_order_id: payload.workOrderId,
    })
    try {
      const saga = await this.runningSaga(payload.workOrderId)
      if (!saga || saga.paymentConfirmed) {
        span.finish()
        return
      }

      saga.markPaymentConfirmed()
      await this.transition(payload.workOrderId, (order) => order.startExecution())
      await this.sagas.update(saga)

      await this.publisher.publish(SagaMessage.StartExecution, {
        workOrderId: payload.workOrderId,
      })
      span.finish()
    } catch (err) {
      span.error(err as Error)
      throw err
    }
  }

  async onPaymentFailed(payload: WorkOrderRefPayload): Promise<void> {
    await this.compensate(payload.workOrderId)
  }

  async onExecutionCompleted(payload: WorkOrderRefPayload): Promise<void> {
    const span = this.tracing.startSpan('saga.execution_completed', {
      work_order_id: payload.workOrderId,
    })
    try {
      const saga = await this.runningSaga(payload.workOrderId)
      if (!saga) {
        span.finish()
        return
      }

      await this.transition(payload.workOrderId, (order) => order.finish())
      saga.complete()
      await this.sagas.update(saga)
      span.finish()
    } catch (err) {
      span.error(err as Error)
      throw err
    }
  }

  async onExecutionFailed(payload: WorkOrderRefPayload): Promise<void> {
    await this.compensate(payload.workOrderId)
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

  private async compensate(workOrderId: string): Promise<void> {
    const span = this.tracing.startSpan('saga.compensate', { work_order_id: workOrderId })
    try {
      const saga = await this.runningSaga(workOrderId)
      if (!saga) {
        span.finish()
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
      span.finish()
    } catch (err) {
      span.error(err as Error)
      throw err
    }
  }
}
