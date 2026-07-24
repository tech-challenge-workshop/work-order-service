import { Inject, Injectable } from '@nestjs/common'
import { CustomerNotFoundError } from '../../domain/errors/customer.errors'
import { Document } from '../../domain/value-objects/document'
import { CUSTOMER_REPOSITORY } from '../ports/customer.repository'
import type { CustomerRepository } from '../ports/customer.repository'
import { CustomerOutput, toCustomerOutput } from '../models/customer.output'

@Injectable()
export class LookupCustomerByDocumentUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customers: CustomerRepository,
  ) {}

  async execute(rawDocument: string): Promise<CustomerOutput> {
    const document = Document.create(rawDocument)
    const customer = await this.customers.findByDocument(document)
    if (!customer || customer.isDeleted) {
      throw new CustomerNotFoundError(document.format())
    }

    return toCustomerOutput(customer)
  }
}
