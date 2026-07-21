import { WorkOrder } from '../../domain/work-order.entity'
import { WorkOrderItemKind } from '../../domain/value-objects/work-order-item'
import { WorkOrderStatus } from '../../domain/value-objects/work-order-status'

export interface WorkOrderItemOutput {
  kind: WorkOrderItemKind
  referenceId: string
  description: string
  unitPriceCents: number
  quantity: number
  subtotalCents: number
}

export interface WorkOrderStatusChangeOutput {
  status: WorkOrderStatus
  changedAt: Date
}

export interface WorkOrderOutput {
  id: string
  customerId: string
  vehicleId: string
  status: WorkOrderStatus
  items: WorkOrderItemOutput[]
  history: WorkOrderStatusChangeOutput[]
  totalCents: number
  createdAt: Date
  updatedAt: Date
}

export function toWorkOrderOutput(workOrder: WorkOrder): WorkOrderOutput {
  return {
    id: workOrder.id,
    customerId: workOrder.customerId,
    vehicleId: workOrder.vehicleId,
    status: workOrder.status,
    items: workOrder.items.map((item) => ({
      kind: item.kind,
      referenceId: item.referenceId,
      description: item.description,
      unitPriceCents: item.unitPriceCents,
      quantity: item.quantity,
      subtotalCents: item.subtotalCents,
    })),
    history: workOrder.history.map((change) => ({
      status: change.status,
      changedAt: change.changedAt,
    })),
    totalCents: workOrder.totalCents,
    createdAt: workOrder.createdAt,
    updatedAt: workOrder.updatedAt,
  }
}
