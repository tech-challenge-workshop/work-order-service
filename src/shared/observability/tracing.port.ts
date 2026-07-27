export const TRACING_PORT = Symbol('TRACING_PORT')

export interface TracingPort {
  /**
   * Runs `fn` inside a new span named `name`. The span is activated in the
   * current scope so any auto-instrumented operation (Prisma, amqplib, HTTP
   * client, etc.) executed inside `fn` becomes a child of it — traces stay
   * hierarchical instead of flat.
   *
   * Errors thrown by `fn` are recorded on the span and re-thrown.
   */
  withSpan<T>(name: string, tags: Record<string, string>, fn: () => Promise<T>): Promise<T>
}
