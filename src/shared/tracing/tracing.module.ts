import { Global, Module } from '@nestjs/common'
import { DatadogTracingService } from './datadog-tracing.service'
import { TRACING_PORT } from './tracing.port'

@Global()
@Module({
  providers: [{ provide: TRACING_PORT, useClass: DatadogTracingService }],
  exports: [TRACING_PORT],
})
export class TracingModule {}
