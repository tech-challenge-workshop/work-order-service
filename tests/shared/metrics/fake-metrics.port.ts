import { MetricsPort, StatusChangeMetric } from '../../../src/shared/metrics/metrics.port'

export class FakeMetricsPort implements MetricsPort {
  readonly statusChanges: StatusChangeMetric[] = []

  recordStatusChange(metric: StatusChangeMetric): void {
    this.statusChanges.push(metric)
  }
}
