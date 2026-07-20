import { Inject, Injectable } from '@nestjs/common'
import { VehicleNotFoundError } from '../../domain/errors/vehicle.errors'
import { VEHICLE_REPOSITORY } from '../ports/vehicle.repository'
import type { VehicleRepository } from '../ports/vehicle.repository'
import { VehicleOutput, toVehicleOutput } from '../models/vehicle.output'

export interface UpdateVehicleCommand {
  id: string
  brand?: string
  model?: string
  year?: number
}

@Injectable()
export class UpdateVehicleUseCase {
  constructor(
    @Inject(VEHICLE_REPOSITORY)
    private readonly vehicles: VehicleRepository,
  ) {}

  async execute(command: UpdateVehicleCommand): Promise<VehicleOutput> {
    const vehicle = await this.vehicles.findById(command.id)
    if (!vehicle) {
      throw new VehicleNotFoundError(command.id)
    }

    vehicle.update({ brand: command.brand, model: command.model, year: command.year })
    await this.vehicles.update(vehicle)

    return toVehicleOutput(vehicle)
  }
}
