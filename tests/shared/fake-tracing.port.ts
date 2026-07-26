import { TracingPort, TraceSpan } from '../../src/shared/tracing/tracing.port'

export class FakeTracingPort implements TracingPort {
  readonly spans: string[] = []

  startSpan(name: string): TraceSpan {
    this.spans.push(name)
    return {
      finish: () => undefined,
      error: () => undefined,
    }
  }
}
