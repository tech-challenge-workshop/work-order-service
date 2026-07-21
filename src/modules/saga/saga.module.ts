import { Module } from '@nestjs/common'
import { WorkOrdersModule } from '../work-orders/work-orders.module'
import { SAGA_INSTANCE_REPOSITORY } from './application/ports/saga-instance.repository'
import { WorkOrderSagaOrchestrator } from './application/work-order-saga.orchestrator'
import { PrismaSagaInstanceRepository } from './infra/prisma-saga-instance.repository'
import { SagaEventsSubscriber } from './infra/saga-events.subscriber'
import { BillingStubSubscriber } from './infra/stubs/billing-stub.subscriber'

@Module({
  imports: [WorkOrdersModule],
  providers: [
    WorkOrderSagaOrchestrator,
    SagaEventsSubscriber,
    BillingStubSubscriber,
    { provide: SAGA_INSTANCE_REPOSITORY, useClass: PrismaSagaInstanceRepository },
  ],
})
export class SagaModule {}
