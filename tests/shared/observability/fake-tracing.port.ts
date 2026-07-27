import { TracingPort } from '../../../src/shared/observability/tracing.port'

export class FakeTracingPort implements TracingPort {
  readonly spans: string[] = []

  withSpan<T>(name: string, _tags: Record<string, string>, fn: () => Promise<T>): Promise<T> {
    this.spans.push(name)
    return fn()
  }
}
