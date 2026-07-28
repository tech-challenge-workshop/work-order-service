import { Global, Module } from '@nestjs/common'
import { DatadogMetricsAdapter } from './datadog-metrics.adapter'
import { METRICS_PORT } from './metrics.port'

@Global()
@Module({
  providers: [{ provide: METRICS_PORT, useClass: DatadogMetricsAdapter }],
  exports: [METRICS_PORT],
})
export class MetricsModule {}
