import { Inject, Injectable } from '@nestjs/common'
import { CUSTOMER_REPOSITORY } from '../ports/customer.repository'
import type { CustomerRepository } from '../ports/customer.repository'
import { CustomerOutput } from '../models/customer.output'

@Injectable()
export class GetCustomerUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customers: CustomerRepository,
  ) {}

  execute(_id: string): Promise<CustomerOutput> {
    return Promise.reject(new Error('Not implemented'))
  }
}
