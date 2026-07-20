import { randomUUID } from 'node:crypto'
import { Vehicle, VehicleProps } from '../../../src/modules/vehicles/domain/vehicle.entity'
import { Plate } from '../../../src/modules/vehicles/domain/value-objects/plate'
import type {
  VehicleRepository,
  ListVehiclesParams,
  PaginatedVehicles,
} from '../../../src/modules/vehicles/application/ports/vehicle.repository'

export const VALID_PLATE = 'ABC1234'
export const VALID_MERCOSUL_PLATE = 'ABC1D23'

export function vehicleWith(overrides: Partial<VehicleProps> = {}): Vehicle {
  return Vehicle.restore({
    id: randomUUID(),
    customerId: randomUUID(),
    plate: Plate.create(VALID_PLATE),
    brand: 'Toyota',
    model: 'Corolla',
    year: 2024,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    deletedAt: null,
    ...overrides,
  })
}

export class FakeVehicleRepository implements VehicleRepository {
  vehicles: Vehicle[] = []
  updateCalls = 0

  create(vehicle: Vehicle): Promise<void> {
    this.vehicles.push(vehicle)
    return Promise.resolve()
  }

  update(_vehicle: Vehicle): Promise<void> {
    this.updateCalls += 1
    return Promise.resolve()
  }

  findById(id: string): Promise<Vehicle | null> {
    const found = this.vehicles.find((vehicle) => vehicle.id === id && !vehicle.isDeleted)
    return Promise.resolve(found ?? null)
  }

  findByPlate(plate: Plate): Promise<Vehicle | null> {
    const found = this.vehicles.find((vehicle) => vehicle.plate.equals(plate))
    return Promise.resolve(found ?? null)
  }

  list(params: ListVehiclesParams): Promise<PaginatedVehicles> {
    const search = params.search?.toLowerCase()
    const matches = this.vehicles
      .filter((vehicle) => !vehicle.isDeleted)
      .filter((vehicle) => !params.customerId || vehicle.customerId === params.customerId)
      .filter(
        (vehicle) =>
          !search ||
          vehicle.plate.value.toLowerCase().includes(search) ||
          vehicle.brand.toLowerCase().includes(search) ||
          vehicle.model.toLowerCase().includes(search),
      )
      .sort((a, b) => a.plate.value.localeCompare(b.plate.value))

    const start = (params.page - 1) * params.perPage
    return Promise.resolve({
      items: matches.slice(start, start + params.perPage),
      total: matches.length,
    })
  }
}
