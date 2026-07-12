import { Inject, Injectable } from '@nestjs/common'
import { CUSTOMER_REPOSITORY } from '../ports/customer.repository'
import type { CustomerRepository } from '../ports/customer.repository'
import { CustomerOutput } from '../models/customer.output'

export interface UpdateCustomerCommand {
  id: string
  name?: string
  email?: string | null
  phone?: string | null
}

@Injectable()
export class UpdateCustomerUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customers: CustomerRepository,
  ) {}

  execute(_command: UpdateCustomerCommand): Promise<CustomerOutput> {
    return Promise.reject(new Error('Not implemented'))
  }
}
