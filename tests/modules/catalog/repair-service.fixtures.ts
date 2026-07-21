import { randomUUID } from 'node:crypto'
import {
  RepairService,
  RepairServiceProps,
} from '../../../src/modules/catalog/domain/repair-service.entity'
import { Money } from '../../../src/modules/catalog/domain/value-objects/money'
import type {
  RepairServiceRepository,
  ListRepairServicesParams,
  PaginatedRepairServices,
} from '../../../src/modules/catalog/application/ports/repair-service.repository'

export function repairServiceWith(overrides: Partial<RepairServiceProps> = {}): RepairService {
  return RepairService.restore({
    id: randomUUID(),
    name: 'Oil change',
    description: 'Includes synthetic oil and filter replacement',
    price: Money.fromCents(15000),
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    deletedAt: null,
    ...overrides,
  })
}

export class FakeRepairServiceRepository implements RepairServiceRepository {
  repairServices: RepairService[] = []
  updateCalls = 0

  create(repairService: RepairService): Promise<void> {
    this.repairServices.push(repairService)
    return Promise.resolve()
  }

  update(_repairService: RepairService): Promise<void> {
    this.updateCalls += 1
    return Promise.resolve()
  }

  findById(id: string): Promise<RepairService | null> {
    const found = this.repairServices.find((service) => service.id === id && !service.isDeleted)
    return Promise.resolve(found ?? null)
  }

  list(params: ListRepairServicesParams): Promise<PaginatedRepairServices> {
    const search = params.search?.toLowerCase()
    const matches = this.repairServices
      .filter((service) => !service.isDeleted)
      .filter((service) => !search || service.name.toLowerCase().includes(search))
      .sort((a, b) => a.name.localeCompare(b.name))

    const start = (params.page - 1) * params.perPage
    return Promise.resolve({
      items: matches.slice(start, start + params.perPage),
      total: matches.length,
    })
  }
}
