import { ListRepairServicesUseCase } from '../../../../../src/modules/catalog/application/use-cases/list-repair-services.use-case'
import { FakeRepairServiceRepository, repairServiceWith } from '../../repair-service.fixtures'

describe('ListRepairServicesUseCase', () => {
  let repository: FakeRepairServiceRepository
  let useCase: ListRepairServicesUseCase

  beforeEach(() => {
    repository = new FakeRepairServiceRepository()
    useCase = new ListRepairServicesUseCase(repository)
  })

  it('returns paginated items with total, page and perPage', async () => {
    repository.repairServices.push(
      repairServiceWith({ name: 'Alignment' }),
      repairServiceWith({ name: 'Oil change' }),
    )

    const output = await useCase.execute({ page: 1, perPage: 1 })

    expect(output.items).toHaveLength(1)
    expect(output.items[0].name).toBe('Alignment')
    expect(output).toMatchObject({ total: 2, page: 1, perPage: 1 })
  })

  it('filters by search term', async () => {
    repository.repairServices.push(
      repairServiceWith({ name: 'Alignment' }),
      repairServiceWith({ name: 'Oil change' }),
    )

    const output = await useCase.execute({ page: 1, perPage: 10, search: 'oil' })

    expect(output.items).toHaveLength(1)
    expect(output.items[0].name).toBe('Oil change')
  })

  it('returns an empty page when there are no services', async () => {
    const output = await useCase.execute({ page: 1, perPage: 10 })

    expect(output.items).toHaveLength(0)
    expect(output.total).toBe(0)
  })
})
