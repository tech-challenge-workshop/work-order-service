import { Inject, Injectable } from '@nestjs/common'
import { RepairServiceNotFoundError } from '../../domain/errors/repair-service.errors'
import { REPAIR_SERVICE_REPOSITORY } from '../ports/repair-service.repository'
import type { RepairServiceRepository } from '../ports/repair-service.repository'
import { RepairServiceOutput, toRepairServiceOutput } from '../models/repair-service.output'

export interface UpdateRepairServiceCommand {
  id: string
  name?: string
  description?: string | null
  priceCents?: number
}

@Injectable()
export class UpdateRepairServiceUseCase {
  constructor(
    @Inject(REPAIR_SERVICE_REPOSITORY)
    private readonly repairServices: RepairServiceRepository,
  ) {}

  async execute(command: UpdateRepairServiceCommand): Promise<RepairServiceOutput> {
    const repairService = await this.repairServices.findById(command.id)
    if (!repairService) {
      throw new RepairServiceNotFoundError(command.id)
    }

    repairService.update({
      name: command.name,
      description: command.description,
      priceCents: command.priceCents,
    })
    await this.repairServices.update(repairService)

    return toRepairServiceOutput(repairService)
  }
}
