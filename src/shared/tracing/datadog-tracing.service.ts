import { Injectable } from '@nestjs/common'
import tracer from 'dd-trace'
import { TracingPort, TraceSpan } from './tracing.port'

@Injectable()
export class DatadogTracingService implements TracingPort {
  startSpan(name: string, tags?: Record<string, string>): TraceSpan {
    const ddSpan = tracer.startSpan(name, { tags })
    return {
      finish: () => ddSpan.finish(),
      error: (err: Error) => {
        ddSpan.setTag('error', err)
        ddSpan.finish()
      },
    }
  }
}
