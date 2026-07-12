import { Injectable } from '@nestjs/common'
import type { Customer as CustomerRow } from '../../../generated/prisma/client'
import { PrismaService } from '../../../shared/database/prisma.service'
import { Customer } from '../domain/customer.entity'
import { Document } from '../domain/value-objects/document'
import { CustomerRepository } from '../application/ports/customer.repository'
import type {
  ListCustomersParams,
  PaginatedCustomers,
} from '../application/ports/customer.repository'

@Injectable()
export class PrismaCustomerRepository implements CustomerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(customer: Customer): Promise<void> {
    await this.prisma.customer.create({ data: this.toRow(customer) })
  }

  update(_customer: Customer): Promise<void> {
    return Promise.reject(new Error('Not implemented'))
  }

  findById(_id: string): Promise<Customer | null> {
    return Promise.reject(new Error('Not implemented'))
  }

  async findByDocument(document: Document): Promise<Customer | null> {
    const row = await this.prisma.customer.findUnique({ where: { document: document.value } })
    return row ? this.toEntity(row) : null
  }

  list(_params: ListCustomersParams): Promise<PaginatedCustomers> {
    return Promise.reject(new Error('Not implemented'))
  }

  private toRow(customer: Customer): CustomerRow {
    return {
      id: customer.id,
      name: customer.name,
      document: customer.document.value,
      documentType: customer.document.type,
      email: customer.email,
      phone: customer.phone,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      deletedAt: customer.deletedAt,
    }
  }

  private toEntity(row: CustomerRow): Customer {
    return Customer.restore({
      id: row.id,
      name: row.name,
      document: Document.create(row.document),
      email: row.email,
      phone: row.phone,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    })
  }
}
