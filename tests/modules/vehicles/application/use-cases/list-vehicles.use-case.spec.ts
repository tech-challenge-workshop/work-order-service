import { randomUUID } from 'node:crypto'
import { Plate } from '../../../../../src/modules/vehicles/domain/value-objects/plate'
import { ListVehiclesUseCase } from '../../../../../src/modules/vehicles/application/use-cases/list-vehicles.use-case'
import { FakeVehicleRepository, vehicleWith, VALID_MERCOSUL_PLATE } from '../../vehicle.fixtures'

describe('ListVehiclesUseCase', () => {
  let repository: FakeVehicleRepository
  let useCase: ListVehiclesUseCase

  beforeEach(() => {
    repository = new FakeVehicleRepository()
    useCase = new ListVehiclesUseCase(repository)
  })

  it('returns paginated items with total, page and perPage', async () => {
    repository.vehicles.push(
      vehicleWith(),
      vehicleWith({ plate: Plate.create(VALID_MERCOSUL_PLATE) }),
    )

    const output = await useCase.execute({ page: 1, perPage: 1 })

    expect(output.items).toHaveLength(1)
    expect(output).toMatchObject({ total: 2, page: 1, perPage: 1 })
  })

  it('filters by owner', async () => {
    const ownerId = randomUUID()
    repository.vehicles.push(
      vehicleWith({ customerId: ownerId }),
      vehicleWith({ plate: Plate.create(VALID_MERCOSUL_PLATE) }),
    )

    const output = await useCase.execute({ page: 1, perPage: 10, customerId: ownerId })

    expect(output.items).toHaveLength(1)
    expect(output.items[0].customerId).toBe(ownerId)
  })

  it('returns an empty page when there are no vehicles', async () => {
    const output = await useCase.execute({ page: 1, perPage: 10 })

    expect(output.items).toHaveLength(0)
    expect(output.total).toBe(0)
  })
})
