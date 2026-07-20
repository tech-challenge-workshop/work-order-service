import { VehicleNotFoundError } from '../../../../../src/modules/vehicles/domain/errors/vehicle.errors'
import { GetVehicleUseCase } from '../../../../../src/modules/vehicles/application/use-cases/get-vehicle.use-case'
import { FakeVehicleRepository, vehicleWith, VALID_PLATE } from '../../vehicle.fixtures'

describe('GetVehicleUseCase', () => {
  let repository: FakeVehicleRepository
  let useCase: GetVehicleUseCase

  beforeEach(() => {
    repository = new FakeVehicleRepository()
    useCase = new GetVehicleUseCase(repository)
  })

  it('returns the vehicle output when found', async () => {
    const vehicle = vehicleWith()
    repository.vehicles.push(vehicle)

    const output = await useCase.execute(vehicle.id)

    expect(output).toMatchObject({ id: vehicle.id, plate: VALID_PLATE, brand: 'Toyota' })
  })

  it('throws VehicleNotFoundError when the id does not exist', async () => {
    await expect(useCase.execute('missing-id')).rejects.toThrow(VehicleNotFoundError)
  })

  it('throws VehicleNotFoundError for soft-deleted vehicles', async () => {
    const vehicle = vehicleWith({ deletedAt: new Date('2026-01-02T00:00:00Z') })
    repository.vehicles.push(vehicle)

    await expect(useCase.execute(vehicle.id)).rejects.toThrow(VehicleNotFoundError)
  })
})
