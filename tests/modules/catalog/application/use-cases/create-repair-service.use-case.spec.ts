import { InvalidPriceError } from '../../../../../src/modules/catalog/domain/errors/repair-service.errors'
import { CreateRepairServiceUseCase } from '../../../../../src/modules/catalog/application/use-cases/create-repair-service.use-case'
import { FakeRepairServiceRepository } from '../../repair-service.fixtures'

describe('CreateRepairServiceUseCase', () => {
  let repository: FakeRepairServiceRepository
  let useCase: CreateRepairServiceUseCase

  beforeEach(() => {
    repository = new FakeRepairServiceRepository()
    useCase = new CreateRepairServiceUseCase(repository)
  })

  it('persists a valid repair service and returns the output model', async () => {
    const output = await useCase.execute({
      name: 'Oil change',
      description: 'Full synthetic',
      priceCents: 15000,
    })

    expect(repository.repairServices).toHaveLength(1)
    expect(output).toMatchObject({
      name: 'Oil change',
      description: 'Full synthetic',
      priceCents: 15000,
    })
    expect(output.id).toBe(repository.repairServices[0].id)
  })

  it('propagates domain validation errors without persisting', async () => {
    await expect(useCase.execute({ name: 'Oil change', priceCents: -1 })).rejects.toThrow(
      InvalidPriceError,
    )
    expect(repository.repairServices).toHaveLength(0)
  })
})
