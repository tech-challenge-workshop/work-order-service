import { Customer } from '../../../../../src/modules/customers/domain/customer.entity'
import {
  DocumentAlreadyInUseError,
  InvalidDocumentError,
} from '../../../../../src/modules/customers/domain/errors/customer.errors'
import { Document } from '../../../../../src/modules/customers/domain/value-objects/document'
import type {
  CustomerRepository,
  ListCustomersParams,
  PaginatedCustomers,
} from '../../../../../src/modules/customers/application/ports/customer.repository'
import { CreateCustomerUseCase } from '../../../../../src/modules/customers/application/use-cases/create-customer.use-case'

const VALID_CPF = '39053344705'
const VALID_CPF_MASKED = '390.533.447-05'

class FakeCustomerRepository implements CustomerRepository {
  customers: Customer[] = []

  create(customer: Customer): Promise<void> {
    this.customers.push(customer)
    return Promise.resolve()
  }

  update(): Promise<void> {
    return Promise.reject(new Error('Not implemented'))
  }

  findById(): Promise<Customer | null> {
    return Promise.reject(new Error('Not implemented'))
  }

  findByDocument(document: Document): Promise<Customer | null> {
    const found = this.customers.find((customer) => customer.document.equals(document))
    return Promise.resolve(found ?? null)
  }

  list(_params: ListCustomersParams): Promise<PaginatedCustomers> {
    return Promise.reject(new Error('Not implemented'))
  }
}

function deletedCustomerWith(document: string): Customer {
  return Customer.restore({
    id: 'e7b8f0f0-1234-4abc-8def-1234567890ab',
    name: 'Deleted Customer',
    document: Document.create(document),
    email: null,
    phone: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    deletedAt: new Date('2026-01-02T00:00:00Z'),
  })
}

describe('CreateCustomerUseCase', () => {
  let repository: FakeCustomerRepository
  let useCase: CreateCustomerUseCase

  beforeEach(() => {
    repository = new FakeCustomerRepository()
    useCase = new CreateCustomerUseCase(repository)
  })

  it('persists a valid customer and returns the output model', async () => {
    const output = await useCase.execute({
      name: 'John Doe',
      document: VALID_CPF,
      email: 'john@example.com',
    })

    expect(repository.customers).toHaveLength(1)
    expect(output).toMatchObject({
      name: 'John Doe',
      email: 'john@example.com',
      phone: null,
    })
    expect(output.id).toBe(repository.customers[0].id)
  })

  it('returns the document masked in the output', async () => {
    const output = await useCase.execute({ name: 'John Doe', document: VALID_CPF })

    expect(output.document).toBe(VALID_CPF_MASKED)
  })

  it('throws DocumentAlreadyInUseError when the document is already registered', async () => {
    await useCase.execute({ name: 'John Doe', document: VALID_CPF })

    await expect(useCase.execute({ name: 'Jane Doe', document: VALID_CPF_MASKED })).rejects.toThrow(
      DocumentAlreadyInUseError,
    )
    expect(repository.customers).toHaveLength(1)
  })

  it('considers soft-deleted customers in the uniqueness check', async () => {
    repository.customers.push(deletedCustomerWith(VALID_CPF))

    await expect(useCase.execute({ name: 'John Doe', document: VALID_CPF })).rejects.toThrow(
      DocumentAlreadyInUseError,
    )
  })

  it('propagates domain validation errors without persisting', async () => {
    await expect(useCase.execute({ name: 'John Doe', document: 'invalid' })).rejects.toThrow(
      InvalidDocumentError,
    )
    expect(repository.customers).toHaveLength(0)
  })
})
