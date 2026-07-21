import { Inject, Injectable } from '@nestjs/common'
import { WORK_ORDER_REPOSITORY } from '../ports/work-order.repository'
import type {
  WorkOrderRepository,
  WorkOrderSummary,
  ListWorkOrdersParams,
} from '../ports/work-order.repository'

export interface ListWorkOrdersOutput {
  items: WorkOrderSummary[]
  total: number
  page: number
  perPage: number
}

@Injectable()
export class ListWorkOrdersUseCase {
  constructor(
    @Inject(WORK_ORDER_REPOSITORY)
    private readonly workOrders: WorkOrderRepository,
  ) {}

  async execute(params: ListWorkOrdersParams): Promise<ListWorkOrdersOutput> {
    const { items, total } = await this.workOrders.listActive(params)

    return {
      items,
      total,
      page: params.page,
      perPage: params.perPage,
    }
  }
}
