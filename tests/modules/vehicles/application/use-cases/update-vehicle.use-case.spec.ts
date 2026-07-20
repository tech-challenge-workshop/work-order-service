import {
  InvalidVehicleError,
  VehicleNotFoundError,
} from '../../../../../src/modules/vehicles/domain/errors/vehicle.errors'
import { UpdateVehicleUseCase } from '../../../../../src/modules/vehicles/application/use-cases/update-vehicle.use-case'
import { FakeVehicleRepository, vehicleWith, VALID_PLATE } from '../../vehicle.fixtures'

describe('UpdateVehicleUseCase', () => {
  let repository: FakeVehicleRepository
  let useCase: UpdateVehicleUseCase

  beforeEach(() => {
    repository = new FakeVehicleRepository()
    useCase = new UpdateVehicleUseCase(repository)
  })

  it('updates provided fields and persists', async () => {
    const vehicle = vehicleWith()
    repository.vehicles.push(vehicle)

    const output = await useCase.execute({ id: vehicle.id, brand: 'Honda', year: 2023 })

    expect(output).toMatchObject({ brand: 'Honda', model: 'Corolla', year: 2023 })
    expect(repository.updateCalls).toBe(1)
  })

  it('keeps the plate unchanged', async () => {
    const vehicle = vehicleWith()
    repository.vehicles.push(vehicle)

    const output = await useCase.execute({ id: vehicle.id, brand: 'Honda' })

    expect(output.plate).toBe(VALID_PLATE)
  })

  it('throws VehicleNotFoundError when the id does not exist', async () => {
    await expect(useCase.execute({ id: 'missing-id', brand: 'Honda' })).rejects.toThrow(
      VehicleNotFoundError,
    )
  })

  it('throws VehicleNotFoundError for soft-deleted vehicles', async () => {
    const vehicle = vehicleWith({ deletedAt: new Date('2026-01-02T00:00:00Z') })
    repository.vehicles.push(vehicle)

    await expect(useCase.execute({ id: vehicle.id, brand: 'Honda' })).rejects.toThrow(
      VehicleNotFoundError,
    )
  })

  it('propagates domain validation errors without persisting', async () => {
    const vehicle = vehicleWith()
    repository.vehicles.push(vehicle)

    await expect(useCase.execute({ id: vehicle.id, year: 1800 })).rejects.toThrow(
      InvalidVehicleError,
    )
    expect(repository.updateCalls).toBe(0)
  })
})
