import { Module } from '@nestjs/common'
import { REPAIR_SERVICE_REPOSITORY } from './application/ports/repair-service.repository'
import { CreateRepairServiceUseCase } from './application/use-cases/create-repair-service.use-case'
import { DeleteRepairServiceUseCase } from './application/use-cases/delete-repair-service.use-case'
import { GetRepairServiceUseCase } from './application/use-cases/get-repair-service.use-case'
import { ListRepairServicesUseCase } from './application/use-cases/list-repair-services.use-case'
import { UpdateRepairServiceUseCase } from './application/use-cases/update-repair-service.use-case'
import { PrismaRepairServiceRepository } from './infra/prisma-repair-service.repository'
import { RepairServicesController } from './presentation/repair-services.controller'

@Module({
  controllers: [RepairServicesController],
  providers: [
    CreateRepairServiceUseCase,
    GetRepairServiceUseCase,
    ListRepairServicesUseCase,
    UpdateRepairServiceUseCase,
    DeleteRepairServiceUseCase,
    { provide: REPAIR_SERVICE_REPOSITORY, useClass: PrismaRepairServiceRepository },
  ],
  exports: [REPAIR_SERVICE_REPOSITORY],
})
export class CatalogModule {}
