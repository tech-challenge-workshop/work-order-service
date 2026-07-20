import { Inject, Injectable } from '@nestjs/common'
import { VehicleNotFoundError } from '../../domain/errors/vehicle.errors'
import { VEHICLE_REPOSITORY } from '../ports/vehicle.repository'
import type { VehicleRepository } from '../ports/vehicle.repository'

@Injectable()
export class DeleteVehicleUseCase {
  constructor(
    @Inject(VEHICLE_REPOSITORY)
    private readonly vehicles: VehicleRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const vehicle = await this.vehicles.findById(id)
    if (!vehicle) {
      throw new VehicleNotFoundError(id)
    }

    vehicle.delete()
    await this.vehicles.update(vehicle)
  }
}
