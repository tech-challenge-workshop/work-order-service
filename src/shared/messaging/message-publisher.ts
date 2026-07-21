export const MESSAGE_PUBLISHER = Symbol('MESSAGE_PUBLISHER')

export interface MessagePublisher {
  publish(pattern: string, payload: Record<string, unknown>): Promise<void>
}
