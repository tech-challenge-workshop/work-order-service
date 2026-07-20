import { Injectable } from '@nestjs/common'
import type { Customer as CustomerRow } from '../../../generated/prisma/client'
import { Prisma } from '../../../generated/prisma/client'
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

  async update(customer: Customer): Promise<void> {
    const { id, ...data } = this.toRow(customer)
    await this.prisma.customer.update({ where: { id }, data })
  }

  async findById(id: string): Promise<Customer | null> {
    const row = await this.prisma.customer.findFirst({ where: { id, deletedAt: null } })
    return row ? this.toEntity(row) : null
  }

  async findByDocument(document: Document): Promise<Customer | null> {
    const row = await this.prisma.customer.findUnique({ where: { document: document.value } })
    return row ? this.toEntity(row) : null
  }

  async list(params: ListCustomersParams): Promise<PaginatedCustomers> {
    const where: Prisma.CustomerWhereInput = {
      deletedAt: null,
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: 'insensitive' } },
              { document: { contains: params.search.replace(/\D/g, '') || params.search } },
            ],
          }
        : {}),
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (params.page - 1) * params.perPage,
        take: params.perPage,
      }),
      this.prisma.customer.count({ where }),
    ])

    return { items: rows.map((row) => this.toEntity(row)), total }
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
