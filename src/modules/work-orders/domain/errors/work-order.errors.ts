import { WorkOrderStatus } from '../value-objects/work-order-status'

export class InvalidWorkOrderError extends Error {
  constructor(reason: string) {
    super(`Invalid work order: ${reason}`)
    this.name = 'InvalidWorkOrderError'
  }
}

export class WorkOrderNotFoundError extends Error {
  constructor(id: string) {
    super(`Work order not found: ${id}`)
    this.name = 'WorkOrderNotFoundError'
  }
}

export class InvalidWorkOrderTransitionError extends Error {
  constructor(from: WorkOrderStatus, to: WorkOrderStatus) {
    super(`Invalid work order transition: ${from} -> ${to}`)
    this.name = 'InvalidWorkOrderTransitionError'
  }
}

export class VehicleDoesNotBelongToCustomerError extends Error {
  constructor() {
    super('The vehicle does not belong to the given customer')
    this.name = 'VehicleDoesNotBelongToCustomerError'
  }
}

export class PartNotFoundError extends Error {
  constructor(ids: string[]) {
    super(`Parts not found: ${ids.join(', ')}`)
    this.name = 'PartNotFoundError'
  }
}
