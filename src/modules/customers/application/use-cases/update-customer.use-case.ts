import { Inject, Injectable } from '@nestjs/common'
import { CustomerNotFoundError } from '../../domain/errors/customer.errors'
import { CUSTOMER_REPOSITORY } from '../ports/customer.repository'
import type { CustomerRepository } from '../ports/customer.repository'
import { CustomerOutput, toCustomerOutput } from '../models/customer.output'

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

  async execute(command: UpdateCustomerCommand): Promise<CustomerOutput> {
    const customer = await this.customers.findById(command.id)
    if (!customer) {
      throw new CustomerNotFoundError(command.id)
    }

    customer.update({ name: command.name, email: command.email, phone: command.phone })
    await this.customers.update(customer)

    return toCustomerOutput(customer)
  }
}
