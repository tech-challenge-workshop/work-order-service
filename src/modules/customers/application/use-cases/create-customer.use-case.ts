import { Inject, Injectable } from '@nestjs/common'
import { Customer } from '../../domain/customer.entity'
import { DocumentAlreadyInUseError } from '../../domain/errors/customer.errors'
import { CUSTOMER_REPOSITORY } from '../ports/customer.repository'
import type { CustomerRepository } from '../ports/customer.repository'
import { CustomerOutput, toCustomerOutput } from '../models/customer.output'

export interface CreateCustomerCommand {
  name: string
  document: string
  email?: string
  phone?: string
}

@Injectable()
export class CreateCustomerUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customers: CustomerRepository,
  ) {}

  async execute(command: CreateCustomerCommand): Promise<CustomerOutput> {
    const customer = Customer.create(command)

    const existing = await this.customers.findByDocument(customer.document)
    if (existing) {
      throw new DocumentAlreadyInUseError()
    }

    await this.customers.create(customer)

    return toCustomerOutput(customer)
  }
}
