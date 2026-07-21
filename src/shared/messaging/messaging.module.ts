import { Global, Module } from '@nestjs/common'
import { MESSAGE_BUS } from './message-bus'
import { RabbitMqBus } from './rabbitmq-bus'

@Global()
@Module({
  providers: [RabbitMqBus, { provide: MESSAGE_BUS, useExisting: RabbitMqBus }],
  exports: [MESSAGE_BUS],
})
export class MessagingModule {}
