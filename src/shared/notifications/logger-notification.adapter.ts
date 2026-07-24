import { Injectable, Logger } from '@nestjs/common'
import { NotificationPort, StatusChangeNotification } from './notification.port'

@Injectable()
export class LoggerNotificationAdapter implements NotificationPort {
  private readonly logger = new Logger('NotificationPort')

  notifyStatusChange(notification: StatusChangeNotification): Promise<void> {
    this.logger.log(
      JSON.stringify({
        event: 'work_order.status_changed',
        workOrderId: notification.workOrderId,
        customerId: notification.customerId,
        previousStatus: notification.previousStatus,
        newStatus: notification.newStatus,
        occurredAt: notification.occurredAt.toISOString(),
      }),
    )
    return Promise.resolve()
  }
}
