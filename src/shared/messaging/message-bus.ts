export const MESSAGE_BUS = Symbol('MESSAGE_BUS')

export const SAGA_EXCHANGE = 'saga'

export type MessageHandler = (payload: Record<string, unknown>) => Promise<void>

export interface MessageBus {
  publish(routingKey: string, payload: Record<string, unknown>): Promise<void>
  subscribe(routingKey: string, handler: MessageHandler): void
}
