import { RepairServiceNotFoundError } from '../../../../../src/modules/catalog/domain/errors/repair-service.errors'
import { GetRepairServiceUseCase } from '../../../../../src/modules/catalog/application/use-cases/get-repair-service.use-case'
import { FakeRepairServiceRepository, repairServiceWith } from '../../repair-service.fixtures'

describe('GetRepairServiceUseCase', () => {
  let repository: FakeRepairServiceRepository
  let useCase: GetRepairServiceUseCase

  beforeEach(() => {
    repository = new FakeRepairServiceRepository()
    useCase = new GetRepairServiceUseCase(repository)
  })

  it('returns the repair service output when found', async () => {
    const service = repairServiceWith()
    repository.repairServices.push(service)

    const output = await useCase.execute(service.id)

    expect(output).toMatchObject({ id: service.id, name: 'Oil change', priceCents: 15000 })
  })

  it('throws RepairServiceNotFoundError when the id does not exist', async () => {
    await expect(useCase.execute('missing-id')).rejects.toThrow(RepairServiceNotFoundError)
  })

  it('throws RepairServiceNotFoundError for soft-deleted services', async () => {
    const service = repairServiceWith({ deletedAt: new Date('2026-01-02T00:00:00Z') })
    repository.repairServices.push(service)

    await expect(useCase.execute(service.id)).rejects.toThrow(RepairServiceNotFoundError)
  })
})
