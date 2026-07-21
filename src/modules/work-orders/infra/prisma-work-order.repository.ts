import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import { Prisma } from '../../../generated/prisma/client'
import { PrismaService } from '../../../shared/database/prisma.service'
import { WorkOrder, WorkOrderStatusChange } from '../domain/work-order.entity'
import { WorkOrderItem, WorkOrderItemKind } from '../domain/value-objects/work-order-item'
import { WorkOrderStatus } from '../domain/value-objects/work-order-status'
import { WorkOrderRepository } from '../application/ports/work-order.repository'
import type {
  ListWorkOrdersParams,
  PaginatedWorkOrders,
  WorkOrderSummary,
} from '../application/ports/work-order.repository'

interface WorkOrderSummaryRow {
  id: string
  customer_id: string
  vehicle_id: string
  status: WorkOrderStatus
  total_cents: number
  created_at: Date
  updated_at: Date
}

interface ItemRow {
  kind: string
  referenceId: string
  description: string
  unitPriceCents: number
  quantity: number
}

interface HistoryRow {
  status: string
  changedAt: Date
}

interface WorkOrderRow {
  id: string
  customerId: string
  vehicleId: string
  status: string
  createdAt: Date
  updatedAt: Date
  items: ItemRow[]
  history: HistoryRow[]
}

const TERMINAL_FILTER = Prisma.sql`status NOT IN ('FINISHED', 'DELIVERED', 'CANCELLED')`

@Injectable()
export class PrismaWorkOrderRepository implements WorkOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(workOrder: WorkOrder): Promise<void> {
    await this.prisma.workOrder.create({
      data: {
        id: workOrder.id,
        customerId: workOrder.customerId,
        vehicleId: workOrder.vehicleId,
        status: workOrder.status,
        totalCents: workOrder.totalCents,
        createdAt: workOrder.createdAt,
        updatedAt: workOrder.updatedAt,
        items: {
          create: workOrder.items.map((item) => ({
            id: randomUUID(),
            kind: item.kind,
            referenceId: item.referenceId,
            description: item.description,
            unitPriceCents: item.unitPriceCents,
            quantity: item.quantity,
          })),
        },
        history: {
          create: workOrder.history.map((change) => ({
            id: randomUUID(),
            status: change.status,
            changedAt: change.changedAt,
          })),
        },
      },
    })
  }

  async update(workOrder: WorkOrder): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.workOrder.update({
        where: { id: workOrder.id },
        data: { status: workOrder.status, updatedAt: workOrder.updatedAt },
      }),
      this.prisma.workOrderStatusHistory.deleteMany({ where: { workOrderId: workOrder.id } }),
      this.prisma.workOrderStatusHistory.createMany({
        data: workOrder.history.map((change) => ({
          id: randomUUID(),
          workOrderId: workOrder.id,
          status: change.status,
          changedAt: change.changedAt,
        })),
      }),
    ])
  }

  async findById(id: string): Promise<WorkOrder | null> {
    const row = await this.prisma.workOrder.findUnique({
      where: { id },
      include: { items: true, history: { orderBy: { changedAt: 'asc' } } },
    })
    return row ? this.toEntity(row) : null
  }

  async listActive(params: ListWorkOrdersParams): Promise<PaginatedWorkOrders> {
    const statusFilter = params.status
      ? Prisma.sql`AND status = ${params.status}::work_order_status`
      : Prisma.empty
    const skip = (params.page - 1) * params.perPage

    const rows = await this.prisma.$queryRaw<WorkOrderSummaryRow[]>(Prisma.sql`
      SELECT id, customer_id, vehicle_id, status, total_cents, created_at, updated_at
      FROM work_orders
      WHERE ${TERMINAL_FILTER} ${statusFilter}
      ORDER BY
        CASE status
          WHEN 'IN_EXECUTION' THEN 0
          WHEN 'AWAITING_APPROVAL' THEN 1
          WHEN 'IN_DIAGNOSIS' THEN 2
          WHEN 'RECEIVED' THEN 3
          ELSE 4
        END,
        created_at ASC
      LIMIT ${params.perPage} OFFSET ${skip}
    `)

    const countRows = await this.prisma.$queryRaw<{ count: number }[]>(Prisma.sql`
      SELECT COUNT(*)::int AS count FROM work_orders WHERE ${TERMINAL_FILTER} ${statusFilter}
    `)

    return {
      items: rows.map((row) => this.toSummary(row)),
      total: countRows[0]?.count ?? 0,
    }
  }

  private toSummary(row: WorkOrderSummaryRow): WorkOrderSummary {
    return {
      id: row.id,
      customerId: row.customer_id,
      vehicleId: row.vehicle_id,
      status: row.status,
      totalCents: row.total_cents,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  private toEntity(row: WorkOrderRow): WorkOrder {
    const items = row.items.map((item) =>
      WorkOrderItem.create({
        kind: item.kind as WorkOrderItemKind,
        referenceId: item.referenceId,
        description: item.description,
        unitPriceCents: item.unitPriceCents,
        quantity: item.quantity,
      }),
    )

    const history: WorkOrderStatusChange[] = row.history.map((change) => ({
      status: change.status as WorkOrderStatus,
      changedAt: change.changedAt,
    }))

    return WorkOrder.restore({
      id: row.id,
      customerId: row.customerId,
      vehicleId: row.vehicleId,
      status: row.status as WorkOrderStatus,
      items,
      history,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })
  }
}
