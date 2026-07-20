export class InvalidPlateError extends Error {
  constructor(raw: string) {
    super(`Invalid vehicle plate: ${raw}`)
    this.name = 'InvalidPlateError'
  }
}

export class InvalidVehicleError extends Error {
  constructor(reason: string) {
    super(`Invalid vehicle: ${reason}`)
    this.name = 'InvalidVehicleError'
  }
}

export class VehicleNotFoundError extends Error {
  constructor(id: string) {
    super(`Vehicle not found: ${id}`)
    this.name = 'VehicleNotFoundError'
  }
}

export class PlateAlreadyInUseError extends Error {
  constructor() {
    super('A vehicle with this plate already exists')
    this.name = 'PlateAlreadyInUseError'
  }
}
