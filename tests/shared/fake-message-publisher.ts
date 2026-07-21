import { MessageBus, MessageHandler } from '../../src/shared/messaging/message-bus'

export interface PublishedMessage {
  pattern: string
  payload: Record<string, unknown>
}

export class FakeMessagePublisher implements MessageBus {
  published: PublishedMessage[] = []

  publish(pattern: string, payload: Record<string, unknown>): Promise<void> {
    this.published.push({ pattern, payload })
    return Promise.resolve()
  }

  subscribe(_routingKey: string, _handler: MessageHandler): void {}

  patterns(): string[] {
    return this.published.map((message) => message.pattern)
  }

  lastPayload(): Record<string, unknown> | undefined {
    return this.published.at(-1)?.payload
  }
}
