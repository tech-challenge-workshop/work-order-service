import { Inject, Injectable } from '@nestjs/common'
import { RepairService } from '../../domain/repair-service.entity'
import { REPAIR_SERVICE_REPOSITORY } from '../ports/repair-service.repository'
import type { RepairServiceRepository } from '../ports/repair-service.repository'
import { RepairServiceOutput, toRepairServiceOutput } from '../models/repair-service.output'

export interface CreateRepairServiceCommand {
  name: string
  description?: string
  priceCents: number
}

@Injectable()
export class CreateRepairServiceUseCase {
  constructor(
    @Inject(REPAIR_SERVICE_REPOSITORY)
    private readonly repairServices: RepairServiceRepository,
  ) {}

  async execute(command: CreateRepairServiceCommand): Promise<RepairServiceOutput> {
    const repairService = RepairService.create(command)

    await this.repairServices.create(repairService)

    return toRepairServiceOutput(repairService)
  }
}
