import { RepairService } from '../../domain/repair-service.entity'

export const REPAIR_SERVICE_REPOSITORY = Symbol('REPAIR_SERVICE_REPOSITORY')

export interface ListRepairServicesParams {
  page: number
  perPage: number
  search?: string
}

export interface PaginatedRepairServices {
  items: RepairService[]
  total: number
}

export interface RepairServiceRepository {
  create(repairService: RepairService): Promise<void>
  update(repairService: RepairService): Promise<void>
  findById(id: string): Promise<RepairService | null>
  list(params: ListRepairServicesParams): Promise<PaginatedRepairServices>
}
