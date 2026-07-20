import { Vehicle } from '../../domain/vehicle.entity'

export interface VehicleOutput {
  id: string
  customerId: string
  plate: string
  brand: string
  model: string
  year: number
  createdAt: Date
  updatedAt: Date
}

export function toVehicleOutput(vehicle: Vehicle): VehicleOutput {
  return {
    id: vehicle.id,
    customerId: vehicle.customerId,
    plate: vehicle.plate.value,
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    createdAt: vehicle.createdAt,
    updatedAt: vehicle.updatedAt,
  }
}
