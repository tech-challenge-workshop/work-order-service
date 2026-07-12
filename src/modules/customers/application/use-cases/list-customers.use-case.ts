import { Inject, Injectable } from '@nestjs/common'
import { CUSTOMER_REPOSITORY } from '../ports/customer.repository'
import type { CustomerRepository, ListCustomersParams } from '../ports/customer.repository'
import { CustomerOutput } from '../models/customer.output'

export interface ListCustomersOutput {
  items: CustomerOutput[]
  total: number
  page: number
  perPage: number
}

@Injectable()
export class ListCustomersUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customers: CustomerRepository,
  ) {}

  execute(_params: ListCustomersParams): Promise<ListCustomersOutput> {
    return Promise.reject(new Error('Not implemented'))
  }
}
