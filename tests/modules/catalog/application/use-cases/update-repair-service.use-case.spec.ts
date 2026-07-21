import {
  InvalidPriceError,
  RepairServiceNotFoundError,
} from '../../../../../src/modules/catalog/domain/errors/repair-service.errors'
import { UpdateRepairServiceUseCase } from '../../../../../src/modules/catalog/application/use-cases/update-repair-service.use-case'
import { FakeRepairServiceRepository, repairServiceWith } from '../../repair-service.fixtures'

describe('UpdateRepairServiceUseCase', () => {
  let repository: FakeRepairServiceRepository
  let useCase: UpdateRepairServiceUseCase

  beforeEach(() => {
    repository = new FakeRepairServiceRepository()
    useCase = new UpdateRepairServiceUseCase(repository)
  })

  it('updates provided fields and persists', async () => {
    const service = repairServiceWith()
    repository.repairServices.push(service)

    const output = await useCase.execute({ id: service.id, name: 'Alignment', priceCents: 8000 })

    expect(output).toMatchObject({ name: 'Alignment', priceCents: 8000 })
    expect(repository.updateCalls).toBe(1)
  })

  it('throws RepairServiceNotFoundError when the id does not exist', async () => {
    await expect(useCase.execute({ id: 'missing-id', name: 'Alignment' })).rejects.toThrow(
      RepairServiceNotFoundError,
    )
  })

  it('throws RepairServiceNotFoundError for soft-deleted services', async () => {
    const service = repairServiceWith({ deletedAt: new Date('2026-01-02T00:00:00Z') })
    repository.repairServices.push(service)

    await expect(useCase.execute({ id: service.id, name: 'Alignment' })).rejects.toThrow(
      RepairServiceNotFoundError,
    )
  })

  it('propagates domain validation errors without persisting', async () => {
    const service = repairServiceWith()
    repository.repairServices.push(service)

    await expect(useCase.execute({ id: service.id, priceCents: -1 })).rejects.toThrow(
      InvalidPriceError,
    )
    expect(repository.updateCalls).toBe(0)
  })
})
