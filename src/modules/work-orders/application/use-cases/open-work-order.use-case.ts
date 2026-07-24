import { Inject, Injectable } from '@nestjs/common'
import { CUSTOMER_REPOSITORY } from '../../../customers/application/ports/customer.repository'
import type { CustomerRepository } from '../../../customers/application/ports/customer.repository'
import { CustomerNotFoundError } from '../../../customers/domain/errors/customer.errors'
import { VEHICLE_REPOSITORY } from '../../../vehicles/application/ports/vehicle.repository'
import type { VehicleRepository } from '../../../vehicles/application/ports/vehicle.repository'
import { VehicleNotFoundError } from '../../../vehicles/domain/errors/vehicle.errors'
import { REPAIR_SERVICE_REPOSITORY } from '../../../catalog/application/ports/repair-service.repository'
import type { RepairServiceRepository } from '../../../catalog/application/ports/repair-service.repository'
import { RepairServiceNotFoundError } from '../../../catalog/domain/errors/repair-service.errors'
import {
  PartNotFoundError,
  VehicleDoesNotBelongToCustomerError,
} from '../../domain/errors/work-order.errors'
import { WorkOrder } from '../../domain/work-order.entity'
import { WorkOrderItem, WorkOrderItemKind } from '../../domain/value-objects/work-order-item'
import { WORK_ORDER_REPOSITORY } from '../ports/work-order.repository'
import type { WorkOrderRepository } from '../ports/work-order.repository'
import { PART_CATALOG_GATEWAY } from '../ports/part-catalog.gateway'
import type { PartCatalogGateway } from '../ports/part-catalog.gateway'
import { MESSAGE_BUS } from '../../../../shared/messaging/message-bus'
import type { MessageBus } from '../../../../shared/messaging/message-bus'
import { NOTIFICATION_PORT } from '../../../../shared/notifications/notification.port'
import type { NotificationPort } from '../../../../shared/notifications/notification.port'
import { SagaMessage } from '../../../../shared/messaging/saga-messages'
import { WorkOrderOutput, toWorkOrderOutput } from '../models/work-order.output'

export interface OpenWorkOrderPart {
  partId: string
  quantity: number
}

export interface OpenWorkOrderCommand {
  customerId: string
  vehicleId: string
  serviceIds: string[]
  parts?: OpenWorkOrderPart[]
}

@Injectable()
export class OpenWorkOrderUseCase {
  constructor(
    @Inject(WORK_ORDER_REPOSITORY)
    private readonly workOrders: WorkOrderRepository,
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customers: CustomerRepository,
    @Inject(VEHICLE_REPOSITORY)
    private readonly vehicles: VehicleRepository,
    @Inject(REPAIR_SERVICE_REPOSITORY)
    private readonly repairServices: RepairServiceRepository,
    @Inject(PART_CATALOG_GATEWAY)
    private readonly partCatalog: PartCatalogGateway,
    @Inject(MESSAGE_BUS)
    private readonly publisher: MessageBus,
    @Inject(NOTIFICATION_PORT)
    private readonly notifier: NotificationPort,
  ) {}

  async execute(command: OpenWorkOrderCommand): Promise<WorkOrderOutput> {
    const customer = await this.customers.findById(command.customerId)
    if (!customer) {
      throw new CustomerNotFoundError(command.customerId)
    }

    const vehicle = await this.vehicles.findById(command.vehicleId)
    if (!vehicle) {
      throw new VehicleNotFoundError(command.vehicleId)
    }
    if (vehicle.customerId !== command.customerId) {
      throw new VehicleDoesNotBelongToCustomerError()
    }

    const items = [
      ...(await this.buildServiceItems(command.serviceIds)),
      ...(await this.buildPartItems(command.parts ?? [])),
    ]

    const workOrder = WorkOrder.open({
      customerId: command.customerId,
      vehicleId: command.vehicleId,
      items,
    })
    await this.workOrders.create(workOrder)

    const firstChange = workOrder.history[0]
    await this.notifier.notifyStatusChange({
      workOrderId: workOrder.id,
      customerId: workOrder.customerId,
      previousStatus: null,
      newStatus: workOrder.status,
      occurredAt: firstChange.changedAt,
    })

    await this.publisher.publish(SagaMessage.WorkOrderOpened, {
      workOrderId: workOrder.id,
      parts: command.parts ?? [],
      totalCents: workOrder.totalCents,
    })

    return toWorkOrderOutput(workOrder)
  }

  private async buildServiceItems(serviceIds: string[]): Promise<WorkOrderItem[]> {
    const items: WorkOrderItem[] = []
    for (const serviceId of serviceIds) {
      const service = await this.repairServices.findById(serviceId)
      if (!service) {
        throw new RepairServiceNotFoundError(serviceId)
      }
      items.push(
        WorkOrderItem.create({
          kind: WorkOrderItemKind.SERVICE,
          referenceId: service.id,
          description: service.name,
          unitPriceCents: service.price.cents,
          quantity: 1,
        }),
      )
    }
    return items
  }

  private async buildPartItems(parts: OpenWorkOrderPart[]): Promise<WorkOrderItem[]> {
    if (parts.length === 0) {
      return []
    }

    const requestedIds = [...new Set(parts.map((part) => part.partId))]
    const snapshots = await this.partCatalog.findByIds(requestedIds)
    const byId = new Map(snapshots.map((snapshot) => [snapshot.partId, snapshot]))

    const missing = requestedIds.filter((id) => !byId.has(id))
    if (missing.length > 0) {
      throw new PartNotFoundError(missing)
    }

    return parts.map((part) => {
      const snapshot = byId.get(part.partId)!
      return WorkOrderItem.create({
        kind: WorkOrderItemKind.PART,
        referenceId: part.partId,
        description: snapshot.description,
        unitPriceCents: snapshot.unitPriceCents,
        quantity: part.quantity,
      })
    })
  }
}
