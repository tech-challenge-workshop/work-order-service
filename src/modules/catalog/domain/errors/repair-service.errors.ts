export class InvalidPriceError extends Error {
  constructor(cents: number) {
    super(`Invalid price: ${cents} (must be a non-negative integer amount in cents)`)
    this.name = 'InvalidPriceError'
  }
}

export class InvalidRepairServiceError extends Error {
  constructor(reason: string) {
    super(`Invalid repair service: ${reason}`)
    this.name = 'InvalidRepairServiceError'
  }
}

export class RepairServiceNotFoundError extends Error {
  constructor(id: string) {
    super(`Repair service not found: ${id}`)
    this.name = 'RepairServiceNotFoundError'
  }
}
