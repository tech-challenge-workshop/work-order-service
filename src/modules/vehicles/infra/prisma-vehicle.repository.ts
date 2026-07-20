import { Injectable } from '@nestjs/common'
import type { Vehicle as VehicleRow } from '../../../generated/prisma/client'
import { Prisma } from '../../../generated/prisma/client'
import { PrismaService } from '../../../shared/database/prisma.service'
import { Vehicle } from '../domain/vehicle.entity'
import { Plate } from '../domain/value-objects/plate'
import { VehicleRepository } from '../application/ports/vehicle.repository'
import type { ListVehiclesParams, PaginatedVehicles } from '../application/ports/vehicle.repository'

@Injectable()
export class PrismaVehicleRepository implements VehicleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(vehicle: Vehicle): Promise<void> {
    await this.prisma.vehicle.create({ data: this.toRow(vehicle) })
  }

  async update(vehicle: Vehicle): Promise<void> {
    const { id, ...data } = this.toRow(vehicle)
    await this.prisma.vehicle.update({ where: { id }, data })
  }

  async findById(id: string): Promise<Vehicle | null> {
    const row = await this.prisma.vehicle.findFirst({ where: { id, deletedAt: null } })
    return row ? this.toEntity(row) : null
  }

  async findByPlate(plate: Plate): Promise<Vehicle | null> {
    const row = await this.prisma.vehicle.findUnique({ where: { plate: plate.value } })
    return row ? this.toEntity(row) : null
  }

  async list(params: ListVehiclesParams): Promise<PaginatedVehicles> {
    const where: Prisma.VehicleWhereInput = {
      deletedAt: null,
      ...(params.customerId ? { customerId: params.customerId } : {}),
      ...(params.search
        ? {
            OR: [
              { plate: { contains: params.search.toUpperCase().replace(/-/g, '') } },
              { brand: { contains: params.search, mode: 'insensitive' } },
              { model: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.vehicle.findMany({
        where,
        orderBy: { plate: 'asc' },
        skip: (params.page - 1) * params.perPage,
        take: params.perPage,
      }),
      this.prisma.vehicle.count({ where }),
    ])

    return { items: rows.map((row) => this.toEntity(row)), total }
  }

  private toRow(vehicle: Vehicle): VehicleRow {
    return {
      id: vehicle.id,
      customerId: vehicle.customerId,
      plate: vehicle.plate.value,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt,
      deletedAt: vehicle.deletedAt,
    }
  }

  private toEntity(row: VehicleRow): Vehicle {
    return Vehicle.restore({
      id: row.id,
      customerId: row.customerId,
      plate: Plate.create(row.plate),
      brand: row.brand,
      model: row.model,
      year: row.year,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    })
  }
}
