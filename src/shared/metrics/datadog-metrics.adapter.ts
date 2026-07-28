import { Injectable } from '@nestjs/common'
import tracer from 'dd-trace'
import { MetricsPort, StatusChangeMetric } from './metrics.port'

export const STATUS_CHANGED_METRIC = 'work_order.status_changed'
export const STATUS_DURATION_METRIC = 'work_order.status_duration'

@Injectable()
export class DatadogMetricsAdapter implements MetricsPort {
  recordStatusChange(metric: StatusChangeMetric): void {
    tracer.dogstatsd.increment(STATUS_CHANGED_METRIC, 1, {
      from: metric.previousStatus ?? 'none',
      to: metric.newStatus,
    })

    if (metric.previousStatus !== null && metric.previousStatusSeconds !== null) {
      tracer.dogstatsd.distribution(STATUS_DURATION_METRIC, metric.previousStatusSeconds, {
        status: metric.previousStatus,
      })
    }
  }
}
