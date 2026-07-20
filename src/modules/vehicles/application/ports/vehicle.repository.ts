import { Vehicle } from '../../domain/vehicle.entity'
import { Plate } from '../../domain/value-objects/plate'

export const VEHICLE_REPOSITORY = Symbol('VEHICLE_REPOSITORY')

export interface ListVehiclesParams {
  page: number
  perPage: number
  search?: string
  customerId?: string
}

export interface PaginatedVehicles {
  items: Vehicle[]
  total: number
}

export interface VehicleRepository {
  create(vehicle: Vehicle): Promise<void>
  update(vehicle: Vehicle): Promise<void>
  findById(id: string): Promise<Vehicle | null>
  findByPlate(plate: Plate): Promise<Vehicle | null>
  list(params: ListVehiclesParams): Promise<PaginatedVehicles>
}
