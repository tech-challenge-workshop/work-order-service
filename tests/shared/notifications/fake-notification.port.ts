import {
  NotificationPort,
  StatusChangeNotification,
} from '../../../src/shared/notifications/notification.port'

export class FakeNotificationPort implements NotificationPort {
  readonly notifications: StatusChangeNotification[] = []

  notifyStatusChange(notification: StatusChangeNotification): Promise<void> {
    this.notifications.push(notification)
    return Promise.resolve()
  }
}
