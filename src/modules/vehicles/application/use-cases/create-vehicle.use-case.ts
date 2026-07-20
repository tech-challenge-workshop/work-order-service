import { Inject, Injectable } from '@nestjs/common'
import { CustomerNotFoundError } from '../../../customers/domain/errors/customer.errors'
import { CUSTOMER_REPOSITORY } from '../../../customers/application/ports/customer.repository'
import type { CustomerRepository } from '../../../customers/application/ports/customer.repository'
import { Vehicle } from '../../domain/vehicle.entity'
import { PlateAlreadyInUseError } from '../../domain/errors/vehicle.errors'
import { VEHICLE_REPOSITORY } from '../ports/vehicle.repository'
import type { VehicleRepository } from '../ports/vehicle.repository'
import { VehicleOutput, toVehicleOutput } from '../models/vehicle.output'

export interface CreateVehicleCommand {
  customerId: string
  plate: string
  brand: string
  model: string
  year: number
}

@Injectable()
export class CreateVehicleUseCase {
  constructor(
    @Inject(VEHICLE_REPOSITORY)
    private readonly vehicles: VehicleRepository,
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customers: CustomerRepository,
  ) {}

  async execute(command: CreateVehicleCommand): Promise<VehicleOutput> {
    const vehicle = Vehicle.create(command)

    const owner = await this.customers.findById(command.customerId)
    if (!owner) {
      throw new CustomerNotFoundError(command.customerId)
    }

    const existing = await this.vehicles.findByPlate(vehicle.plate)
    if (existing) {
      throw new PlateAlreadyInUseError()
    }

    await this.vehicles.create(vehicle)

    return toVehicleOutput(vehicle)
  }
}
