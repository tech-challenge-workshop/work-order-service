import { Controller, Inject } from '@nestjs/common'
import { EventPattern, Payload } from '@nestjs/microservices'
import { MESSAGE_PUBLISHER } from '../../../../shared/messaging/message-publisher'
import type { MessagePublisher } from '../../../../shared/messaging/message-publisher'
import { SagaMessage } from '../../../../shared/messaging/saga-messages'
import type { WorkOrderRefPayload } from '../../../../shared/messaging/saga-messages'

@Controller()
export class ExecutionStubController {
  constructor(
    @Inject(MESSAGE_PUBLISHER)
    private readonly publisher: MessagePublisher,
  ) {}

  @EventPattern(SagaMessage.ReserveParts)
  async onReserveParts(@Payload() payload: WorkOrderRefPayload): Promise<void> {
    await this.publisher.publish(SagaMessage.PartsReserved, { workOrderId: payload.workOrderId })
  }

  @EventPattern(SagaMessage.ReleaseParts)
  onReleaseParts(): void {}

  @EventPattern(SagaMessage.StartExecution)
  async onStartExecution(@Payload() payload: WorkOrderRefPayload): Promise<void> {
    await this.publisher.publish(SagaMessage.ExecutionCompleted, {
      workOrderId: payload.workOrderId,
    })
  }
}
