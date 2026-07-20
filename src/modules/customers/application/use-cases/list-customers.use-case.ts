import { Inject, Injectable } from '@nestjs/common'
import { CUSTOMER_REPOSITORY } from '../ports/customer.repository'
import type { CustomerRepository, ListCustomersParams } from '../ports/customer.repository'
import { CustomerOutput, toCustomerOutput } from '../models/customer.output'

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

  async execute(params: ListCustomersParams): Promise<ListCustomersOutput> {
    const { items, total } = await this.customers.list(params)

    return {
      items: items.map(toCustomerOutput),
      total,
      page: params.page,
      perPage: params.perPage,
    }
  }
}
