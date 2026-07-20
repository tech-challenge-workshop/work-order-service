import { randomUUID } from 'node:crypto'
import { Customer, CustomerProps } from '../../../src/modules/customers/domain/customer.entity'
import { Document } from '../../../src/modules/customers/domain/value-objects/document'
import type {
  CustomerRepository,
  ListCustomersParams,
  PaginatedCustomers,
} from '../../../src/modules/customers/application/ports/customer.repository'

export const VALID_CPF = '39053344705'
export const VALID_CPF_MASKED = '390.533.447-05'
export const VALID_CNPJ = '11222333000181'

export function customerWith(overrides: Partial<CustomerProps> = {}): Customer {
  return Customer.restore({
    id: randomUUID(),
    name: 'John Doe',
    document: Document.create(VALID_CPF),
    email: null,
    phone: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    deletedAt: null,
    ...overrides,
  })
}

export class FakeCustomerRepository implements CustomerRepository {
  customers: Customer[] = []
  updateCalls = 0

  create(customer: Customer): Promise<void> {
    this.customers.push(customer)
    return Promise.resolve()
  }

  update(_customer: Customer): Promise<void> {
    this.updateCalls += 1
    return Promise.resolve()
  }

  findById(id: string): Promise<Customer | null> {
    const found = this.customers.find((customer) => customer.id === id && !customer.isDeleted)
    return Promise.resolve(found ?? null)
  }

  findByDocument(document: Document): Promise<Customer | null> {
    const found = this.customers.find((customer) => customer.document.equals(document))
    return Promise.resolve(found ?? null)
  }

  list(params: ListCustomersParams): Promise<PaginatedCustomers> {
    const search = params.search?.toLowerCase()
    const matches = this.customers
      .filter((customer) => !customer.isDeleted)
      .filter(
        (customer) =>
          !search ||
          customer.name.toLowerCase().includes(search) ||
          customer.document.value.includes(search),
      )
      .sort((a, b) => a.name.localeCompare(b.name))

    const start = (params.page - 1) * params.perPage
    return Promise.resolve({
      items: matches.slice(start, start + params.perPage),
      total: matches.length,
    })
  }
}
