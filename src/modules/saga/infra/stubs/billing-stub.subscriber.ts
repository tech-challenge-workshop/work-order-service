import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { MESSAGE_BUS } from '../../../../shared/messaging/message-bus'
import type { MessageBus } from '../../../../shared/messaging/message-bus'
import { SagaMessage } from '../../../../shared/messaging/saga-messages'
import type { WorkOrderRefPayload } from '../../../../shared/messaging/saga-messages'

@Injectable()
export class BillingStubSubscriber implements OnModuleInit {
  constructor(
    @Inject(MESSAGE_BUS)
    private readonly bus: MessageBus,
  ) {}

  onModuleInit(): void {
    this.bus.subscribe(SagaMessage.GenerateQuote, (payload) => this.onGenerateQuote(payload))
    this.bus.subscribe(SagaMessage.ConfirmPayment, (payload) => this.onConfirmPayment(payload))
    this.bus.subscribe(SagaMessage.CancelQuote, () => Promise.resolve())
    this.bus.subscribe(SagaMessage.RefundPayment, () => Promise.resolve())
  }

  private async onGenerateQuote(payload: Record<string, unknown>): Promise<void> {
    const { workOrderId } = payload as unknown as WorkOrderRefPayload
    await this.bus.publish(SagaMessage.QuoteGenerated, { workOrderId })
  }

  private async onConfirmPayment(payload: Record<string, unknown>): Promise<void> {
    const { workOrderId } = payload as unknown as WorkOrderRefPayload
    await this.bus.publish(SagaMessage.PaymentConfirmed, { workOrderId })
  }
}
