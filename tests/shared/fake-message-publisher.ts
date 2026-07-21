import { MessagePublisher } from '../../src/shared/messaging/message-publisher'

export interface PublishedMessage {
  pattern: string
  payload: Record<string, unknown>
}

export class FakeMessagePublisher implements MessagePublisher {
  published: PublishedMessage[] = []

  publish(pattern: string, payload: Record<string, unknown>): Promise<void> {
    this.published.push({ pattern, payload })
    return Promise.resolve()
  }

  patterns(): string[] {
    return this.published.map((message) => message.pattern)
  }

  lastPayload(): Record<string, unknown> | undefined {
    return this.published.at(-1)?.payload
  }
}
