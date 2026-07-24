import { Global, Module } from '@nestjs/common'
import { LoggerNotificationAdapter } from './logger-notification.adapter'
import { NOTIFICATION_PORT } from './notification.port'

@Global()
@Module({
  providers: [{ provide: NOTIFICATION_PORT, useClass: LoggerNotificationAdapter }],
  exports: [NOTIFICATION_PORT],
})
export class NotificationsModule {}
