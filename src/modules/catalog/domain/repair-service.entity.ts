import { randomUUID } from 'node:crypto'
import { InvalidRepairServiceError } from './errors/repair-service.errors'
import { Money } from './value-objects/money'

export interface RepairServiceProps {
  id: string
  name: string
  description: string | null
  price: Money
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface CreateRepairServiceInput {
  name: string
  description?: string
  priceCents: number
}

export interface UpdateRepairServiceInput {
  name?: string
  description?: string | null
  priceCents?: number
}

function validateName(name: string): string {
  const trimmed = name.trim()
  if (trimmed.length === 0) {
    throw new InvalidRepairServiceError('name must not be empty')
  }
  return trimmed
}

function normalizeDescription(description: string | null): string | null {
  if (description === null) {
    return null
  }
  const trimmed = description.trim()
  return trimmed.length === 0 ? null : trimmed
}

export class RepairService {
  private constructor(private readonly props: RepairServiceProps) {}

  static create(input: CreateRepairServiceInput): RepairService {
    const now = new Date()

    return new RepairService({
      id: randomUUID(),
      name: validateName(input.name),
      description: normalizeDescription(input.description ?? null),
      price: Money.fromCents(input.priceCents),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    })
  }

  static restore(props: RepairServiceProps): RepairService {
    return new RepairService(props)
  }

  update(input: UpdateRepairServiceInput): void {
    if (input.name !== undefined) {
      this.props.name = validateName(input.name)
    }

    if (input.description !== undefined) {
      this.props.description = normalizeDescription(input.description)
    }

    if (input.priceCents !== undefined) {
      this.props.price = Money.fromCents(input.priceCents)
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

  get name(): string {
    return this.props.name
  }

  get description(): string | null {
    return this.props.description
  }

  get price(): Money {
    return this.props.price
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
