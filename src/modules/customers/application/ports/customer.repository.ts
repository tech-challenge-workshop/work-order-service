import { Customer } from '../../domain/customer.entity'
import { Document } from '../../domain/value-objects/document'

export const CUSTOMER_REPOSITORY = Symbol('CUSTOMER_REPOSITORY')

export interface ListCustomersParams {
  page: number
  perPage: number
  search?: string
}

export interface PaginatedCustomers {
  items: Customer[]
  total: number
}

export interface CustomerRepository {
  create(customer: Customer): Promise<void>
  update(customer: Customer): Promise<void>
  findById(id: string): Promise<Customer | null>
  findByDocument(document: Document): Promise<Customer | null>
  list(params: ListCustomersParams): Promise<PaginatedCustomers>
}
