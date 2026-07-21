import { WorkOrder } from '../../domain/work-order.entity'
import { WorkOrderStatus } from '../../domain/value-objects/work-order-status'

export const WORK_ORDER_REPOSITORY = Symbol('WORK_ORDER_REPOSITORY')

export interface WorkOrderSummary {
  id: string
  customerId: string
  vehicleId: string
  status: WorkOrderStatus
  totalCents: number
  createdAt: Date
  updatedAt: Date
}

export interface ListWorkOrdersParams {
  page: number
  perPage: number
  status?: WorkOrderStatus
}

export interface PaginatedWorkOrders {
  items: WorkOrderSummary[]
  total: number
}

export interface WorkOrderRepository {
  create(workOrder: WorkOrder): Promise<void>
  update(workOrder: WorkOrder): Promise<void>
  findById(id: string): Promise<WorkOrder | null>
  listActive(params: ListWorkOrdersParams): Promise<PaginatedWorkOrders>
}
