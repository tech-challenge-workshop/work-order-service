import { randomUUID } from 'node:crypto'
import { InvalidVehicleError } from './errors/vehicle.errors'
import { Plate } from './value-objects/plate'

const MIN_YEAR = 1900

export interface VehicleProps {
  id: string
  customerId: string
  plate: Plate
  brand: string
  model: string
  year: number
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface CreateVehicleInput {
  customerId: string
  plate: string
  brand: string
  model: string
  year: number
}

export interface UpdateVehicleInput {
  brand?: string
  model?: string
  year?: number
}

function validateBrand(brand: string): string {
  const trimmed = brand.trim()
  if (trimmed.length === 0) {
    throw new InvalidVehicleError('brand must not be empty')
  }
  return trimmed
}

function validateModel(model: string): string {
  const trimmed = model.trim()
  if (trimmed.length === 0) {
    throw new InvalidVehicleError('model must not be empty')
  }
  return trimmed
}

function validateYear(year: number): number {
  const maxYear = new Date().getFullYear() + 1
  if (!Number.isInteger(year) || year < MIN_YEAR || year > maxYear) {
    throw new InvalidVehicleError(`year must be between ${MIN_YEAR} and ${maxYear}`)
  }
  return year
}

export class Vehicle {
  private constructor(private readonly props: VehicleProps) {}

  static create(input: CreateVehicleInput): Vehicle {
    const now = new Date()

    return new Vehicle({
      id: randomUUID(),
      customerId: input.customerId,
      plate: Plate.create(input.plate),
      brand: validateBrand(input.brand),
      model: validateModel(input.model),
      year: validateYear(input.year),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    })
  }

  static restore(props: VehicleProps): Vehicle {
    return new Vehicle(props)
  }

  update(input: UpdateVehicleInput): void {
    if (input.brand !== undefined) {
      this.props.brand = validateBrand(input.brand)
    }

    if (input.model !== undefined) {
      this.props.model = validateModel(input.model)
    }

    if (input.year !== undefined) {
      this.props.year = validateYear(input.year)
    }

    this.props.updatedAt = new Date()
  }

  delete(): void {
    if (this.props.deletedAt === null) {
      this.props.deletedAt = new Date()
    }
  }

  get id(): string {
    return this.props.id
  }

  get customerId(): string {
    return this.props.customerId
  }

  get plate(): Plate {
    return this.props.plate
  }

  get brand(): string {
    return this.props.brand
  }

  get model(): string {
    return this.props.model
  }

  get year(): number {
    return this.props.year
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt
  }

  get isDeleted(): boolean {
    return this.props.deletedAt !== null
  }
}
