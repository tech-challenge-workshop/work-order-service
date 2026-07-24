import { WorkOrderStatus } from '../../modules/work-orders/domain/value-objects/work-order-status'

export const NOTIFICATION_PORT = Symbol('NOTIFICATION_PORT')

export interface StatusChangeNotification {
  workOrderId: string
  customerId: string
  previousStatus: WorkOrderStatus | null
  newStatus: WorkOrderStatus
  occurredAt: Date
}

export interface NotificationPort {
  notifyStatusChange(notification: StatusChangeNotification): Promise<void>
}
