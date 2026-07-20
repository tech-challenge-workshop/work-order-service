import { Inject, Injectable } from '@nestjs/common'
import { VehicleNotFoundError } from '../../domain/errors/vehicle.errors'
import { VEHICLE_REPOSITORY } from '../ports/vehicle.repository'
import type { VehicleRepository } from '../ports/vehicle.repository'
import { VehicleOutput, toVehicleOutput } from '../models/vehicle.output'

@Injectable()
export class GetVehicleUseCase {
  constructor(
    @Inject(VEHICLE_REPOSITORY)
    private readonly vehicles: VehicleRepository,
  ) {}

  async execute(id: string): Promise<VehicleOutput> {
    const vehicle = await this.vehicles.findById(id)
    if (!vehicle) {
      throw new VehicleNotFoundError(id)
    }

    return toVehicleOutput(vehicle)
  }
}
