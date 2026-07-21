import { RepairServiceNotFoundError } from '../../../../../src/modules/catalog/domain/errors/repair-service.errors'
import { DeleteRepairServiceUseCase } from '../../../../../src/modules/catalog/application/use-cases/delete-repair-service.use-case'
import { FakeRepairServiceRepository, repairServiceWith } from '../../repair-service.fixtures'

describe('DeleteRepairServiceUseCase', () => {
  let repository: FakeRepairServiceRepository
  let useCase: DeleteRepairServiceUseCase

  beforeEach(() => {
    repository = new FakeRepairServiceRepository()
    useCase = new DeleteRepairServiceUseCase(repository)
  })

  it('soft-deletes an existing service and persists', async () => {
    const service = repairServiceWith()
    repository.repairServices.push(service)

    await useCase.execute(service.id)

    expect(service.isDeleted).toBe(true)
    expect(repository.updateCalls).toBe(1)
  })

  it('throws RepairServiceNotFoundError when the id does not exist', async () => {
    await expect(useCase.execute('missing-id')).rejects.toThrow(RepairServiceNotFoundError)
  })

  it('throws RepairServiceNotFoundError when already deleted', async () => {
    const service = repairServiceWith({ deletedAt: new Date('2026-01-02T00:00:00Z') })
    repository.repairServices.push(service)

    await expect(useCase.execute(service.id)).rejects.toThrow(RepairServiceNotFoundError)
  })
})
