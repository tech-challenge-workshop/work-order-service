import { SagaEventsSubscriber } from '../../../src/modules/saga/infra/saga-events.subscriber'
import { WorkOrderSagaOrchestrator } from '../../../src/modules/saga/application/work-order-saga.orchestrator'
import { SagaMessage } from '../../../src/shared/messaging/saga-messages'
import type { MessageBus, MessageHandler } from '../../../src/shared/messaging/message-bus'

class CapturingBus implements MessageBus {
  handlers = new Map<string, MessageHandler>()

  publish(): Promise<void> {
    return Promise.resolve()
  }

  subscribe(routingKey: string, handler: MessageHandler): void {
    this.handlers.set(routingKey, handler)
  }
}

describe('SagaEventsSubscriber', () => {
  it('routes every saga event to the matching orchestrator method', async () => {
    const bus = new CapturingBus()
    const handler = () => jest.fn().mockResolvedValue(undefined)
    const methods = {
      onWorkOrderOpened: handler(),
      onPartsReserved: handler(),
      onPartsReservationFailed: handler(),
      onQuoteGenerated: handler(),
      onQuoteApproved: handler(),
      onQuoteRejected: handler(),
      onPaymentConfirmed: handler(),
      onPaymentFailed: handler(),
      onExecutionCompleted: handler(),
      onExecutionFailed: handler(),
    }

    new SagaEventsSubscriber(bus, methods as unknown as WorkOrderSagaOrchestrator).onModuleInit()

    const payload = { workOrderId: 'wo-1' }
    const routes: [string, jest.Mock][] = [
      [SagaMessage.WorkOrderOpened, methods.onWorkOrderOpened],
      [SagaMessage.PartsReserved, methods.onPartsReserved],
      [SagaMessage.PartsReservationFailed, methods.onPartsReservationFailed],
      [SagaMessage.QuoteGenerated, methods.onQuoteGenerated],
      [SagaMessage.QuoteApproved, methods.onQuoteApproved],
      [SagaMessage.QuoteRejected, methods.onQuoteRejected],
      [SagaMessage.PaymentConfirmed, methods.onPaymentConfirmed],
      [SagaMessage.PaymentFailed, methods.onPaymentFailed],
      [SagaMessage.ExecutionCompleted, methods.onExecutionCompleted],
      [SagaMessage.ExecutionFailed, methods.onExecutionFailed],
    ]

    for (const [routingKey, method] of routes) {
      await bus.handlers.get(routingKey)!(payload)
      expect(method).toHaveBeenCalledWith(payload)
    }
  })
})
