import { Inject, Injectable } from '@nestjs/common'
import { VEHICLE_REPOSITORY } from '../ports/vehicle.repository'
import type { VehicleRepository, ListVehiclesParams } from '../ports/vehicle.repository'
import { VehicleOutput, toVehicleOutput } from '../models/vehicle.output'

export interface ListVehiclesOutput {
  items: VehicleOutput[]
  total: number
  page: number
  perPage: number
}

@Injectable()
export class ListVehiclesUseCase {
  constructor(
    @Inject(VEHICLE_REPOSITORY)
    private readonly vehicles: VehicleRepository,
  ) {}

  async execute(params: ListVehiclesParams): Promise<ListVehiclesOutput> {
    const { items, total } = await this.vehicles.list(params)

    return {
      items: items.map(toVehicleOutput),
      total,
      page: params.page,
      perPage: params.perPage,
    }
  }
}
