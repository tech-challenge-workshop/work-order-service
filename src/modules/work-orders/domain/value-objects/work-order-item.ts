import { InvalidWorkOrderError } from '../errors/work-order.errors'

export enum WorkOrderItemKind {
  SERVICE = 'SERVICE',
  PART = 'PART',
}

export interface WorkOrderItemProps {
  kind: WorkOrderItemKind
  referenceId: string
  description: string
  unitPriceCents: number
  quantity: number
}

export class WorkOrderItem {
  private constructor(private readonly props: WorkOrderItemProps) {}

  static create(props: WorkOrderItemProps): WorkOrderItem {
    if (!Number.isInteger(props.unitPriceCents) || props.unitPriceCents < 0) {
      throw new InvalidWorkOrderError('item unit price must be a non-negative integer')
    }
    if (!Number.isInteger(props.quantity) || props.quantity < 1) {
      throw new InvalidWorkOrderError('item quantity must be a positive integer')
    }

    return new WorkOrderItem(props)
  }

  get kind(): WorkOrderItemKind {
    return this.props.kind
  }

  get referenceId(): string {
    return this.props.referenceId
  }

  get description(): string {
    return this.props.description
  }

  get unitPriceCents(): number {
    return this.props.unitPriceCents
  }

  get quantity(): number {
    return this.props.quantity
  }

  get subtotalCents(): number {
    return this.props.unitPriceCents * this.props.quantity
  }
}
