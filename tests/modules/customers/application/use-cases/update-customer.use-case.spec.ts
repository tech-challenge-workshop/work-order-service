import {
  CustomerNotFoundError,
  InvalidCustomerError,
} from '../../../../../src/modules/customers/domain/errors/customer.errors'
import { UpdateCustomerUseCase } from '../../../../../src/modules/customers/application/use-cases/update-customer.use-case'
import { customerWith, FakeCustomerRepository, VALID_CPF_MASKED } from '../../customer.fixtures'

describe('UpdateCustomerUseCase', () => {
  let repository: FakeCustomerRepository
  let useCase: UpdateCustomerUseCase

  beforeEach(() => {
    repository = new FakeCustomerRepository()
    useCase = new UpdateCustomerUseCase(repository)
  })

  it('updates provided fields and persists', async () => {
    const customer = customerWith({ email: 'old@example.com' })
    repository.customers.push(customer)

    const output = await useCase.execute({
      id: customer.id,
      name: 'Jane Doe',
      phone: '+55 11 99999-9999',
    })

    expect(output).toMatchObject({
      name: 'Jane Doe',
      email: 'old@example.com',
      phone: '+55 11 99999-9999',
    })
    expect(repository.updateCalls).toBe(1)
  })

  it('throws CustomerNotFoundError when the id does not exist', async () => {
    await expect(useCase.execute({ id: 'missing-id', name: 'Jane' })).rejects.toThrow(
      CustomerNotFoundError,
    )
  })

  it('throws CustomerNotFoundError for soft-deleted customers', async () => {
    const customer = customerWith({ deletedAt: new Date('2026-01-02T00:00:00Z') })
    repository.customers.push(customer)

    await expect(useCase.execute({ id: customer.id, name: 'Jane' })).rejects.toThrow(
      CustomerNotFoundError,
    )
  })

  it('does not allow changing the document', async () => {
    const customer = customerWith()
    repository.customers.push(customer)

    const output = await useCase.execute({ id: customer.id, name: 'Jane Doe' })

    expect(output.document).toBe(VALID_CPF_MASKED)
  })

  it('propagates domain validation errors without persisting', async () => {
    const customer = customerWith()
    repository.customers.push(customer)

    await expect(useCase.execute({ id: customer.id, name: '   ' })).rejects.toThrow(
      InvalidCustomerError,
    )
    expect(repository.updateCalls).toBe(0)
  })
})
