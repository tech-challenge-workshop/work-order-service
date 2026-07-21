import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { MESSAGE_PUBLISHER } from './message-publisher'
import { RabbitMqMessagePublisher, SAGA_CLIENT } from './rabbitmq-message-publisher'

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: SAGA_CLIENT,
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.getOrThrow<string>('RABBITMQ_URL')],
            queue: config.getOrThrow<string>('RABBITMQ_QUEUE'),
            queueOptions: { durable: true },
          },
        }),
      },
    ]),
  ],
  providers: [{ provide: MESSAGE_PUBLISHER, useClass: RabbitMqMessagePublisher }],
  exports: [MESSAGE_PUBLISHER],
})
export class MessagingModule {}
