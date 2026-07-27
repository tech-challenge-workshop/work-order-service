import { Injectable } from '@nestjs/common'
import tracer from 'dd-trace'
import { TracingPort } from './tracing.port'

@Injectable()
export class DatadogTracingService implements TracingPort {
  withSpan<T>(name: string, tags: Record<string, string>, fn: () => Promise<T>): Promise<T> {
    return tracer.trace(name, { tags }, async (span) => {
      try {
        return await fn()
      } catch (err) {
        span?.setTag('error', err)
        throw err
      }
    })
  }
}
