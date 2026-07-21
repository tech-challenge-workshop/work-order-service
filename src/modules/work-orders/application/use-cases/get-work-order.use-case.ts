import { Inject, Injectable } from '@nestjs/common'
import { WorkOrderNotFoundError } from '../../domain/errors/work-order.errors'
import { WORK_ORDER_REPOSITORY } from '../ports/work-order.repository'
import type { WorkOrderRepository } from '../ports/work-order.repository'
import { WorkOrderOutput, toWorkOrderOutput } from '../models/work-order.output'

@Injectable()
export class GetWorkOrderUseCase {
  constructor(
    @Inject(WORK_ORDER_REPOSITORY)
    private readonly workOrders: WorkOrderRepository,
  ) {}

  async execute(id: string): Promise<WorkOrderOutput> {
    const workOrder = await this.workOrders.findById(id)
    if (!workOrder) {
      throw new WorkOrderNotFoundError(id)
    }

    return toWorkOrderOutput(workOrder)
  }
}
