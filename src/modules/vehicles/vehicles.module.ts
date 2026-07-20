import { Module } from '@nestjs/common'
import { CustomersModule } from '../customers/customers.module'
import { VEHICLE_REPOSITORY } from './application/ports/vehicle.repository'
import { CreateVehicleUseCase } from './application/use-cases/create-vehicle.use-case'
import { DeleteVehicleUseCase } from './application/use-cases/delete-vehicle.use-case'
import { GetVehicleUseCase } from './application/use-cases/get-vehicle.use-case'
import { ListVehiclesUseCase } from './application/use-cases/list-vehicles.use-case'
import { UpdateVehicleUseCase } from './application/use-cases/update-vehicle.use-case'
import { PrismaVehicleRepository } from './infra/prisma-vehicle.repository'
import { VehiclesController } from './presentation/vehicles.controller'

@Module({
  imports: [CustomersModule],
  controllers: [VehiclesController],
  providers: [
    CreateVehicleUseCase,
    GetVehicleUseCase,
    ListVehiclesUseCase,
    UpdateVehicleUseCase,
    DeleteVehicleUseCase,
    { provide: VEHICLE_REPOSITORY, useClass: PrismaVehicleRepository },
  ],
  exports: [VEHICLE_REPOSITORY],
})
export class VehiclesModule {}
