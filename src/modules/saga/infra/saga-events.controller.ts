import { Controller } from '@nestjs/common'
import { EventPattern, Payload } from '@nestjs/microservices'
import { WorkOrderSagaOrchestrator } from '../application/work-order-saga.orchestrator'
import { SagaMessage } from '../../../shared/messaging/saga-messages'
import type {
  WorkOrderOpenedPayload,
  WorkOrderRefPayload,
} from '../../../shared/messaging/saga-messages'

@Controller()
export class SagaEventsController {
  constructor(private readonly orchestrator: WorkOrderSagaOrchestrator) {}

  @EventPattern(SagaMessage.WorkOrderOpened)
  onWorkOrderOpened(@Payload() payload: WorkOrderOpenedPayload): Promise<void> {
    return this.orchestrator.onWorkOrderOpened(payload)
  }

  @EventPattern(SagaMessage.PartsReserved)
  onPartsReserved(@Payload() payload: WorkOrderRefPayload): Promise<void> {
    return this.orchestrator.onPartsReserved(payload)
  }

  @EventPattern(SagaMessage.PartsReservationFailed)
  onPartsReservationFailed(@Payload() payload: WorkOrderRefPayload): Promise<void> {
    return this.orchestrator.onPartsReservationFailed(payload)
  }

  @EventPattern(SagaMessage.QuoteGenerated)
  onQuoteGenerated(@Payload() payload: WorkOrderRefPayload): Promise<void> {
    return this.orchestrator.onQuoteGenerated(payload)
  }

  @EventPattern(SagaMessage.QuoteApproved)
  onQuoteApproved(@Payload() payload: WorkOrderRefPayload): Promise<void> {
    return this.orchestrator.onQuoteApproved(payload)
  }

  @EventPattern(SagaMessage.QuoteRejected)
  onQuoteRejected(@Payload() payload: WorkOrderRefPayload): Promise<void> {
    return this.orchestrator.onQuoteRejected(payload)
  }

  @EventPattern(SagaMessage.PaymentConfirmed)
  onPaymentConfirmed(@Payload() payload: WorkOrderRefPayload): Promise<void> {
    return this.orchestrator.onPaymentConfirmed(payload)
  }

  @EventPattern(SagaMessage.PaymentFailed)
  onPaymentFailed(@Payload() payload: WorkOrderRefPayload): Promise<void> {
    return this.orchestrator.onPaymentFailed(payload)
  }

  @EventPattern(SagaMessage.ExecutionCompleted)
  onExecutionCompleted(@Payload() payload: WorkOrderRefPayload): Promise<void> {
    return this.orchestrator.onExecutionCompleted(payload)
  }

  @EventPattern(SagaMessage.ExecutionFailed)
  onExecutionFailed(@Payload() payload: WorkOrderRefPayload): Promise<void> {
    return this.orchestrator.onExecutionFailed(payload)
  }
}
