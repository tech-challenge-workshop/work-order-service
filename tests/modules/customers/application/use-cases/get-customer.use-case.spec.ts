import { CustomerNotFoundError } from '../../../../../src/modules/customers/domain/errors/customer.errors'
import { GetCustomerUseCase } from '../../../../../src/modules/customers/application/use-cases/get-customer.use-case'
import { customerWith, FakeCustomerRepository, VALID_CPF_MASKED } from '../../customer.fixtures'

describe('GetCustomerUseCase', () => {
  let repository: FakeCustomerRepository
  let useCase: GetCustomerUseCase

  beforeEach(() => {
    repository = new FakeCustomerRepository()
    useCase = new GetCustomerUseCase(repository)
  })

  it('returns the customer output when found', async () => {
    const customer = customerWith({ email: 'john@example.com' })
    repository.customers.push(customer)

    const output = await useCase.execute(customer.id)

    expect(output).toMatchObject({
      id: customer.id,
      name: 'John Doe',
      document: VALID_CPF_MASKED,
      email: 'john@example.com',
    })
  })

  it('throws CustomerNotFoundError when the id does not exist', async () => {
    await expect(useCase.execute('missing-id')).rejects.toThrow(CustomerNotFoundError)
  })

  it('throws CustomerNotFoundError for soft-deleted customers', async () => {
    const customer = customerWith({ deletedAt: new Date('2026-01-02T00:00:00Z') })
    repository.customers.push(customer)

    await expect(useCase.execute(customer.id)).rejects.toThrow(CustomerNotFoundError)
  })
})
