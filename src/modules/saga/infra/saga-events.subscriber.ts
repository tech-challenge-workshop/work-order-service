import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { MESSAGE_BUS } from '../../../shared/messaging/message-bus'
import type { MessageBus } from '../../../shared/messaging/message-bus'
import { SagaMessage } from '../../../shared/messaging/saga-messages'
import type {
  WorkOrderOpenedPayload,
  WorkOrderRefPayload,
} from '../../../shared/messaging/saga-messages'
import { WorkOrderSagaOrchestrator } from '../application/work-order-saga.orchestrator'

@Injectable()
export class SagaEventsSubscriber implements OnModuleInit {
  constructor(
    @Inject(MESSAGE_BUS)
    private readonly bus: MessageBus,
    private readonly orchestrator: WorkOrderSagaOrchestrator,
  ) {}

  onModuleInit(): void {
    this.bus.subscribe(SagaMessage.WorkOrderOpened, (payload) =>
      this.orchestrator.onWorkOrderOpened(payload as unknown as WorkOrderOpenedPayload),
    )
    this.bus.subscribe(SagaMessage.PartsReserved, (payload) =>
      this.orchestrator.onPartsReserved(payload as unknown as WorkOrderRefPayload),
    )
    this.bus.subscribe(SagaMessage.PartsReservationFailed, (payload) =>
      this.orchestrator.onPartsReservationFailed(payload as unknown as WorkOrderRefPayload),
    )
    this.bus.subscribe(SagaMessage.QuoteGenerated, (payload) =>
      this.orchestrator.onQuoteGenerated(payload as unknown as WorkOrderRefPayload),
    )
    this.bus.subscribe(SagaMessage.QuoteApproved, (payload) =>
      this.orchestrator.onQuoteApproved(payload as unknown as WorkOrderRefPayload),
    )
    this.bus.subscribe(SagaMessage.QuoteRejected, (payload) =>
      this.orchestrator.onQuoteRejected(payload as unknown as WorkOrderRefPayload),
    )
    this.bus.subscribe(SagaMessage.PaymentConfirmed, (payload) =>
      this.orchestrator.onPaymentConfirmed(payload as unknown as WorkOrderRefPayload),
    )
    this.bus.subscribe(SagaMessage.PaymentFailed, (payload) =>
      this.orchestrator.onPaymentFailed(payload as unknown as WorkOrderRefPayload),
    )
    this.bus.subscribe(SagaMessage.ExecutionCompleted, (payload) =>
      this.orchestrator.onExecutionCompleted(payload as unknown as WorkOrderRefPayload),
    )
    this.bus.subscribe(SagaMessage.ExecutionFailed, (payload) =>
      this.orchestrator.onExecutionFailed(payload as unknown as WorkOrderRefPayload),
    )
  }
}
