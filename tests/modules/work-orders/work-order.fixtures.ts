import { randomUUID } from 'node:crypto'
import { WorkOrder } from '../../../src/modules/work-orders/domain/work-order.entity'
import {
  WorkOrderItem,
  WorkOrderItemKind,
  WorkOrderItemProps,
} from '../../../src/modules/work-orders/domain/value-objects/work-order-item'
import {
  WorkOrderStatus,
  listingPriorityOf,
  TERMINAL_STATUSES,
} from '../../../src/modules/work-orders/domain/value-objects/work-order-status'
import type {
  WorkOrderRepository,
  ListWorkOrdersParams,
  PaginatedWorkOrders,
} from '../../../src/modules/work-orders/application/ports/work-order.repository'
import type {
  PartCatalogGateway,
  PartSnapshot,
} from '../../../src/modules/work-orders/application/ports/part-catalog.gateway'

export function serviceItem(overrides: Partial<WorkOrderItemProps> = {}): WorkOrderItem {
  return WorkOrderItem.create({
    kind: WorkOrderItemKind.SERVICE,
    referenceId: randomUUID(),
    description: 'Oil change',
    unitPriceCents: 15000,
    quantity: 1,
    ...overrides,
  })
}

export function openWorkOrder(
  overrides: { customerId?: string; vehicleId?: string; items?: WorkOrderItem[] } = {},
): WorkOrder {
  return WorkOrder.open({
    customerId: overrides.customerId ?? randomUUID(),
    vehicleId: overrides.vehicleId ?? randomUUID(),
    items: overrides.items ?? [serviceItem()],
  })
}

export class FakeWorkOrderRepository implements WorkOrderRepository {
  workOrders: WorkOrder[] = []
  updateCalls = 0

  create(workOrder: WorkOrder): Promise<void> {
    this.workOrders.push(workOrder)
    return Promise.resolve()
  }

  update(_workOrder: WorkOrder): Promise<void> {
    this.updateCalls += 1
    return Promise.resolve()
  }

  findById(id: string): Promise<WorkOrder | null> {
    return Promise.resolve(this.workOrders.find((workOrder) => workOrder.id === id) ?? null)
  }

  listActive(params: ListWorkOrdersParams): Promise<PaginatedWorkOrders> {
    const matches = this.workOrders
      .filter((workOrder) => !TERMINAL_STATUSES.includes(workOrder.status))
      .filter((workOrder) => !params.status || workOrder.status === params.status)
      .sort((a, b) => {
        const byPriority = listingPriorityOf(a.status) - listingPriorityOf(b.status)
        return byPriority !== 0 ? byPriority : a.createdAt.getTime() - b.createdAt.getTime()
      })

    const start = (params.page - 1) * params.perPage
    const page = matches.slice(start, start + params.perPage)

    return Promise.resolve({
      items: page.map((workOrder) => ({
        id: workOrder.id,
        customerId: workOrder.customerId,
        vehicleId: workOrder.vehicleId,
        status: workOrder.status,
        totalCents: workOrder.totalCents,
        createdAt: workOrder.createdAt,
        updatedAt: workOrder.updatedAt,
      })),
      total: matches.length,
    })
  }
}

export class FakePartCatalogGateway implements PartCatalogGateway {
  private readonly parts = new Map<string, PartSnapshot>()

  register(snapshot: PartSnapshot): void {
    this.parts.set(snapshot.partId, snapshot)
  }

  findByIds(ids: string[]): Promise<PartSnapshot[]> {
    const found = ids
      .map((id) => this.parts.get(id))
      .filter((snapshot): snapshot is PartSnapshot => snapshot !== undefined)
    return Promise.resolve(found)
  }
}

export { WorkOrderStatus, WorkOrderItemKind }
