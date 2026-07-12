import { Inject, Injectable } from '@nestjs/common'
import { CUSTOMER_REPOSITORY } from '../ports/customer.repository'
import type { CustomerRepository } from '../ports/customer.repository'

@Injectable()
export class DeleteCustomerUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customers: CustomerRepository,
  ) {}

  execute(_id: string): Promise<void> {
    return Promise.reject(new Error('Not implemented'))
  }
}
