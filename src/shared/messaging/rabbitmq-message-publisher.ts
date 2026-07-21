import { Inject, Injectable } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { lastValueFrom } from 'rxjs'
import { MessagePublisher } from './message-publisher'

export const SAGA_CLIENT = 'SAGA_CLIENT'

@Injectable()
export class RabbitMqMessagePublisher implements MessagePublisher {
  constructor(@Inject(SAGA_CLIENT) private readonly client: ClientProxy) {}

  async publish(pattern: string, payload: Record<string, unknown>): Promise<void> {
    await lastValueFrom(this.client.emit(pattern, payload))
  }
}
