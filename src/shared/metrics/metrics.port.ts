import { WorkOrderStatus } from '../../modules/work-orders/domain/value-objects/work-order-status'

export const METRICS_PORT = Symbol('METRICS_PORT')

export interface StatusChangeMetric {
  previousStatus: WorkOrderStatus | null
  newStatus: WorkOrderStatus
  previousStatusSeconds: number | null
}

export interface MetricsPort {
  recordStatusChange(metric: StatusChangeMetric): void
}
