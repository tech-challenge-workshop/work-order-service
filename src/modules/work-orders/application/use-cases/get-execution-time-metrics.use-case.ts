import { Inject, Injectable } from '@nestjs/common'
import { WORK_ORDER_REPOSITORY } from '../ports/work-order.repository'
import type { WorkOrderRepository } from '../ports/work-order.repository'

export interface ExecutionTimeMetrics {
  sampleSize: number
  averageSeconds: number | null
}

@Injectable()
export class GetExecutionTimeMetricsUseCase {
  constructor(
    @Inject(WORK_ORDER_REPOSITORY)
    private readonly workOrders: WorkOrderRepository,
  ) {}

  async execute(): Promise<ExecutionTimeMetrics> {
    const durations = await this.workOrders.getExecutionDurations()
    if (durations.length === 0) {
      return { sampleSize: 0, averageSeconds: null }
    }

    const totalSeconds = durations.reduce(
      (sum, entry) => sum + (entry.finishedAt.getTime() - entry.startedAt.getTime()) / 1000,
      0,
    )
    return {
      sampleSize: durations.length,
      averageSeconds: Math.round(totalSeconds / durations.length),
    }
  }
}
