import { Controller, Inject } from '@nestjs/common'
import { EventPattern, Payload } from '@nestjs/microservices'
import { MESSAGE_PUBLISHER } from '../../../../shared/messaging/message-publisher'
import type { MessagePublisher } from '../../../../shared/messaging/message-publisher'
import { SagaMessage } from '../../../../shared/messaging/saga-messages'
import type { WorkOrderRefPayload } from '../../../../shared/messaging/saga-messages'

@Controller()
export class BillingStubController {
  constructor(
    @Inject(MESSAGE_PUBLISHER)
    private readonly publisher: MessagePublisher,
  ) {}

  @EventPattern(SagaMessage.GenerateQuote)
  async onGenerateQuote(@Payload() payload: WorkOrderRefPayload): Promise<void> {
    await this.publisher.publish(SagaMessage.QuoteGenerated, { workOrderId: payload.workOrderId })
  }

  @EventPattern(SagaMessage.ConfirmPayment)
  async onConfirmPayment(@Payload() payload: WorkOrderRefPayload): Promise<void> {
    await this.publisher.publish(SagaMessage.PaymentConfirmed, { workOrderId: payload.workOrderId })
  }

  @EventPattern(SagaMessage.CancelQuote)
  onCancelQuote(): void {}

  @EventPattern(SagaMessage.RefundPayment)
  onRefundPayment(): void {}
}
