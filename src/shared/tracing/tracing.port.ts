export const TRACING_PORT = Symbol('TRACING_PORT')

export interface TraceSpan {
  finish(): void
  error(err: Error): void
}

export interface TracingPort {
  startSpan(name: string, tags?: Record<string, string>): TraceSpan
}
