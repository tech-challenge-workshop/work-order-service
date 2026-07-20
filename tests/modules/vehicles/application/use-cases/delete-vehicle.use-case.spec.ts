import { VehicleNotFoundError } from '../../../../../src/modules/vehicles/domain/errors/vehicle.errors'
import { DeleteVehicleUseCase } from '../../../../../src/modules/vehicles/application/use-cases/delete-vehicle.use-case'
import { FakeVehicleRepository, vehicleWith } from '../../vehicle.fixtures'

describe('DeleteVehicleUseCase', () => {
  let repository: FakeVehicleRepository
  let useCase: DeleteVehicleUseCase

  beforeEach(() => {
    repository = new FakeVehicleRepository()
    useCase = new DeleteVehicleUseCase(repository)
  })

  it('soft-deletes an existing vehicle and persists', async () => {
    const vehicle = vehicleWith()
    repository.vehicles.push(vehicle)

    await useCase.execute(vehicle.id)

    expect(vehicle.isDeleted).toBe(true)
    expect(repository.updateCalls).toBe(1)
  })

  it('throws VehicleNotFoundError when the id does not exist', async () => {
    await expect(useCase.execute('missing-id')).rejects.toThrow(VehicleNotFoundError)
  })

  it('throws VehicleNotFoundError when already deleted', async () => {
    const vehicle = vehicleWith({ deletedAt: new Date('2026-01-02T00:00:00Z') })
    repository.vehicles.push(vehicle)

    await expect(useCase.execute(vehicle.id)).rejects.toThrow(VehicleNotFoundError)
  })
})
