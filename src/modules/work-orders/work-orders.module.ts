import { Module } from '@nestjs/common'
import { CatalogModule } from '../catalog/catalog.module'
import { CustomersModule } from '../customers/customers.module'
import { VehiclesModule } from '../vehicles/vehicles.module'
import { WORK_ORDER_REPOSITORY } from './application/ports/work-order.repository'
import { PART_CATALOG_GATEWAY } from './application/ports/part-catalog.gateway'
import { OpenWorkOrderUseCase } from './application/use-cases/open-work-order.use-case'
import { GetWorkOrderUseCase } from './application/use-cases/get-work-order.use-case'
import { ListWorkOrdersUseCase } from './application/use-cases/list-work-orders.use-case'
import { HttpPartCatalogGateway } from './infra/http-part-catalog.gateway'
import { PrismaWorkOrderRepository } from './infra/prisma-work-order.repository'
import { WorkOrdersController } from './presentation/work-orders.controller'

@Module({
  imports: [CustomersModule, VehiclesModule, CatalogModule],
  controllers: [WorkOrdersController],
  providers: [
    OpenWorkOrderUseCase,
    GetWorkOrderUseCase,
    ListWorkOrdersUseCase,
    { provide: WORK_ORDER_REPOSITORY, useClass: PrismaWorkOrderRepository },
    { provide: PART_CATALOG_GATEWAY, useClass: HttpPartCatalogGateway },
  ],
})
export class WorkOrdersModule {}
