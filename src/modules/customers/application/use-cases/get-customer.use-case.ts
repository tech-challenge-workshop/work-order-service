import { Inject, Injectable } from '@nestjs/common'
import { CustomerNotFoundError } from '../../domain/errors/customer.errors'
import { CUSTOMER_REPOSITORY } from '../ports/customer.repository'
import type { CustomerRepository } from '../ports/customer.repository'
import { CustomerOutput, toCustomerOutput } from '../models/customer.output'

@Injectable()
export class GetCustomerUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customers: CustomerRepository,
  ) {}

  async execute(id: string): Promise<CustomerOutput> {
    const customer = await this.customers.findById(id)
    if (!customer) {
      throw new CustomerNotFoundError(id)
    }

    return toCustomerOutput(customer)
  }
}
