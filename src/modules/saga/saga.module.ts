import { Module } from '@nestjs/common'
import { WorkOrdersModule } from '../work-orders/work-orders.module'
import { ObservabilityModule } from '../../shared/observability/observability.module'
import { SAGA_INSTANCE_REPOSITORY } from './application/ports/saga-instance.repository'
import { WorkOrderSagaOrchestrator } from './application/work-order-saga.orchestrator'
import { PrismaSagaInstanceRepository } from './infra/prisma-saga-instance.repository'
import { SagaEventsSubscriber } from './infra/saga-events.subscriber'

@Module({
  imports: [WorkOrdersModule, ObservabilityModule],
  providers: [
    WorkOrderSagaOrchestrator,
    SagaEventsSubscriber,
    { provide: SAGA_INSTANCE_REPOSITORY, useClass: PrismaSagaInstanceRepository },
  ],
})
export class SagaModule {}
