import { CustomerNotFoundError } from '../../../../../src/modules/customers/domain/errors/customer.errors'
import { DeleteCustomerUseCase } from '../../../../../src/modules/customers/application/use-cases/delete-customer.use-case'
import { customerWith, FakeCustomerRepository } from '../../customer.fixtures'

describe('DeleteCustomerUseCase', () => {
  let repository: FakeCustomerRepository
  let useCase: DeleteCustomerUseCase

  beforeEach(() => {
    repository = new FakeCustomerRepository()
    useCase = new DeleteCustomerUseCase(repository)
  })

  it('soft-deletes an existing customer and persists', async () => {
    const customer = customerWith()
    repository.customers.push(customer)

    await useCase.execute(customer.id)

    expect(customer.isDeleted).toBe(true)
    expect(repository.updateCalls).toBe(1)
  })

  it('throws CustomerNotFoundError when the id does not exist', async () => {
    await expect(useCase.execute('missing-id')).rejects.toThrow(CustomerNotFoundError)
  })

  it('throws CustomerNotFoundError when already deleted', async () => {
    const customer = customerWith({ deletedAt: new Date('2026-01-02T00:00:00Z') })
    repository.customers.push(customer)

    await expect(useCase.execute(customer.id)).rejects.toThrow(CustomerNotFoundError)
  })
})
