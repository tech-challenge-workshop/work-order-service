import { Inject, Injectable } from '@nestjs/common'
import { REPAIR_SERVICE_REPOSITORY } from '../ports/repair-service.repository'
import type {
  RepairServiceRepository,
  ListRepairServicesParams,
} from '../ports/repair-service.repository'
import { RepairServiceOutput, toRepairServiceOutput } from '../models/repair-service.output'

export interface ListRepairServicesOutput {
  items: RepairServiceOutput[]
  total: number
  page: number
  perPage: number
}

@Injectable()
export class ListRepairServicesUseCase {
  constructor(
    @Inject(REPAIR_SERVICE_REPOSITORY)
    private readonly repairServices: RepairServiceRepository,
  ) {}

  async execute(params: ListRepairServicesParams): Promise<ListRepairServicesOutput> {
    const { items, total } = await this.repairServices.list(params)

    return {
      items: items.map(toRepairServiceOutput),
      total,
      page: params.page,
      perPage: params.perPage,
    }
  }
}
