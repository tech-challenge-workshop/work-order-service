import { randomUUID } from 'node:crypto'
import { InvalidWorkOrderError } from './errors/work-order.errors'
import { InvalidWorkOrderTransitionError } from './errors/work-order.errors'
import { WorkOrderItem } from './value-objects/work-order-item'
import { WorkOrderStatus, canTransition } from './value-objects/work-order-status'

export interface WorkOrderStatusChange {
  status: WorkOrderStatus
  changedAt: Date
}

export interface WorkOrderProps {
  id: string
  customerId: string
  vehicleId: string
  status: WorkOrderStatus
  items: WorkOrderItem[]
  history: WorkOrderStatusChange[]
  createdAt: Date
  updatedAt: Date
}

export interface OpenWorkOrderInput {
  customerId: string
  vehicleId: string
  items: WorkOrderItem[]
}

export class WorkOrder {
  private constructor(private readonly props: WorkOrderProps) {}

  static open(input: OpenWorkOrderInput): WorkOrder {
    if (input.items.length === 0) {
      throw new InvalidWorkOrderError('a work order must have at least one item')
    }

    const now = new Date()

    return new WorkOrder({
      id: randomUUID(),
      customerId: input.customerId,
      vehicleId: input.vehicleId,
      status: WorkOrderStatus.RECEIVED,
      items: input.items,
      history: [{ status: WorkOrderStatus.RECEIVED, changedAt: now }],
      createdAt: now,
      updatedAt: now,
    })
  }

  static restore(props: WorkOrderProps): WorkOrder {
    return new WorkOrder(props)
  }

  startDiagnosis(): void {
    this.changeStatus(WorkOrderStatus.IN_DIAGNOSIS)
  }

  requestApproval(): void {
    this.changeStatus(WorkOrderStatus.AWAITING_APPROVAL)
  }

  startExecution(): void {
    this.changeStatus(WorkOrderStatus.IN_EXECUTION)
  }

  finish(): void {
    this.changeStatus(WorkOrderStatus.FINISHED)
  }

  deliver(): void {
    this.changeStatus(WorkOrderStatus.DELIVERED)
  }

  cancel(): void {
    this.changeStatus(WorkOrderStatus.CANCELLED)
  }

  private changeStatus(target: WorkOrderStatus): void {
    if (!canTransition(this.props.status, target)) {
      throw new InvalidWorkOrderTransitionError(this.props.status, target)
    }

    const now = new Date()
    this.props.status = target
    this.props.history.push({ status: target, changedAt: now })
    this.props.updatedAt = now
  }

  get id(): string {
    return this.props.id
  }

  get customerId(): string {
    return this.props.customerId
  }

  get vehicleId(): string {
    return this.props.vehicleId
  }

  get status(): WorkOrderStatus {
    return this.props.status
  }

  get items(): readonly WorkOrderItem[] {
    return this.props.items
  }

  get history(): readonly WorkOrderStatusChange[] {
    return this.props.history
  }

  get totalCents(): number {
    return this.props.items.reduce((total, item) => total + item.subtotalCents, 0)
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }
}
