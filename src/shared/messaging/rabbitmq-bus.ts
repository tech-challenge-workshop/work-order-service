import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AmqpConnectionManager, ChannelWrapper, connect } from 'amqp-connection-manager'
import type { ConfirmChannel, ConsumeMessage } from 'amqplib'
import { MESSAGE_BUS, MessageBus, MessageHandler, SAGA_EXCHANGE } from './message-bus'

@Injectable()
export class RabbitMqBus implements MessageBus, OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(MESSAGE_BUS.toString())
  private readonly handlers = new Map<string, MessageHandler>()
  private readonly url: string
  private readonly queue: string
  private connection?: AmqpConnectionManager
  private channel?: ChannelWrapper

  constructor(config: ConfigService) {
    this.url = config.getOrThrow<string>('RABBITMQ_URL')
    this.queue = config.getOrThrow<string>('RABBITMQ_QUEUE')
  }

  subscribe(routingKey: string, handler: MessageHandler): void {
    this.handlers.set(routingKey, handler)
  }

  onApplicationBootstrap(): void {
    this.connection = connect([this.url])
    this.channel = this.connection.createChannel({
      json: false,
      setup: async (channel: ConfirmChannel) => {
        await channel.assertExchange(SAGA_EXCHANGE, 'topic', { durable: true })
        await channel.assertQueue(this.queue, { durable: true })
        for (const routingKey of this.handlers.keys()) {
          await channel.bindQueue(this.queue, SAGA_EXCHANGE, routingKey)
        }
        await channel.consume(this.queue, (message) => this.dispatch(message))
      },
    })
  }

  async publish(routingKey: string, payload: Record<string, unknown>): Promise<void> {
    if (!this.channel) {
      throw new Error('Message bus not initialized')
    }
    await this.channel.publish(SAGA_EXCHANGE, routingKey, Buffer.from(JSON.stringify(payload)))
  }

  private dispatch(message: ConsumeMessage | null): void {
    if (!message || !this.channel) {
      return
    }

    const handler = this.handlers.get(message.fields.routingKey)
    if (!handler) {
      this.channel.ack(message)
      return
    }

    const payload = JSON.parse(message.content.toString()) as Record<string, unknown>
    handler(payload)
      .catch((error: unknown) => this.logger.error(`Handler failed: ${String(error)}`))
      .finally(() => this.channel?.ack(message))
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close()
    await this.connection?.close()
  }
}
