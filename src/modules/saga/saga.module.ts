import { Module } from '@nestjs/common'
import { MessagingModule } from '../../shared/messaging/messaging.module'
import { WorkOrdersModule } from '../work-orders/work-orders.module'
import { SAGA_INSTANCE_REPOSITORY } from './application/ports/saga-instance.repository'
import { WorkOrderSagaOrchestrator } from './application/work-order-saga.orchestrator'
import { PrismaSagaInstanceRepository } from './infra/prisma-saga-instance.repository'
import { SagaEventsController } from './infra/saga-events.controller'
import { BillingStubController } from './infra/stubs/billing-stub.controller'
import { ExecutionStubController } from './infra/stubs/execution-stub.controller'

@Module({
  imports: [WorkOrdersModule, MessagingModule],
  controllers: [SagaEventsController, ExecutionStubController, BillingStubController],
  providers: [
    WorkOrderSagaOrchestrator,
    { provide: SAGA_INSTANCE_REPOSITORY, useClass: PrismaSagaInstanceRepository },
  ],
})
export class SagaModule {}
