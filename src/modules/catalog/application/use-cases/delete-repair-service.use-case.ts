import { Inject, Injectable } from '@nestjs/common'
import { RepairServiceNotFoundError } from '../../domain/errors/repair-service.errors'
import { REPAIR_SERVICE_REPOSITORY } from '../ports/repair-service.repository'
import type { RepairServiceRepository } from '../ports/repair-service.repository'

@Injectable()
export class DeleteRepairServiceUseCase {
  constructor(
    @Inject(REPAIR_SERVICE_REPOSITORY)
    private readonly repairServices: RepairServiceRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const repairService = await this.repairServices.findById(id)
    if (!repairService) {
      throw new RepairServiceNotFoundError(id)
    }

    repairService.delete()
    await this.repairServices.update(repairService)
  }
}
