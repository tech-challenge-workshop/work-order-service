import { Injectable } from '@nestjs/common'
import type { RepairService as RepairServiceRow } from '../../../generated/prisma/client'
import { Prisma } from '../../../generated/prisma/client'
import { PrismaService } from '../../../shared/database/prisma.service'
import { RepairService } from '../domain/repair-service.entity'
import { Money } from '../domain/value-objects/money'
import { RepairServiceRepository } from '../application/ports/repair-service.repository'
import type {
  ListRepairServicesParams,
  PaginatedRepairServices,
} from '../application/ports/repair-service.repository'

@Injectable()
export class PrismaRepairServiceRepository implements RepairServiceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(repairService: RepairService): Promise<void> {
    await this.prisma.repairService.create({ data: this.toRow(repairService) })
  }

  async update(repairService: RepairService): Promise<void> {
    const { id, ...data } = this.toRow(repairService)
    await this.prisma.repairService.update({ where: { id }, data })
  }

  async findById(id: string): Promise<RepairService | null> {
    const row = await this.prisma.repairService.findFirst({ where: { id, deletedAt: null } })
    return row ? this.toEntity(row) : null
  }

  async list(params: ListRepairServicesParams): Promise<PaginatedRepairServices> {
    const where: Prisma.RepairServiceWhereInput = {
      deletedAt: null,
      ...(params.search ? { name: { contains: params.search, mode: 'insensitive' } } : {}),
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.repairService.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (params.page - 1) * params.perPage,
        take: params.perPage,
      }),
      this.prisma.repairService.count({ where }),
    ])

    return { items: rows.map((row) => this.toEntity(row)), total }
  }

  private toRow(repairService: RepairService): RepairServiceRow {
    return {
      id: repairService.id,
      name: repairService.name,
      description: repairService.description,
      priceCents: repairService.price.cents,
      createdAt: repairService.createdAt,
      updatedAt: repairService.updatedAt,
      deletedAt: repairService.deletedAt,
    }
  }

  private toEntity(row: RepairServiceRow): RepairService {
    return RepairService.restore({
      id: row.id,
      name: row.name,
      description: row.description,
      price: Money.fromCents(row.priceCents),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    })
  }
}
