import { randomUUID } from 'node:crypto'
import { InvalidCustomerError } from './errors/customer.errors'
import { Document } from './value-objects/document'

export interface CustomerProps {
  id: string
  name: string
  document: Document
  email: string | null
  phone: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface CreateCustomerInput {
  name: string
  document: string
  email?: string
  phone?: string
}

export interface UpdateCustomerInput {
  name?: string
  email?: string | null
  phone?: string | null
}

export class Customer {
  private constructor(private readonly props: CustomerProps) {}

  static create(input: CreateCustomerInput): Customer {
    const name = input.name.trim()
    if (name.length === 0) {
      throw new InvalidCustomerError('name must not be empty')
    }

    const now = new Date()

    return new Customer({
      id: randomUUID(),
      name,
      document: Document.create(input.document),
      email: input.email ?? null,
      phone: input.phone ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    })
  }

  static restore(props: CustomerProps): Customer {
    return new Customer(props)
  }

  update(input: UpdateCustomerInput): void {
    if (input.name !== undefined) {
      const name = input.name.trim()
      if (name.length === 0) {
        throw new InvalidCustomerError('name must not be empty')
      }
      this.props.name = name
    }

    if (input.email !== undefined) {
      this.props.email = input.email
    }

    if (input.phone !== undefined) {
      this.props.phone = input.phone
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

  get document(): Document {
    return this.props.document
  }

  get email(): string | null {
    return this.props.email
  }

  get phone(): string | null {
    return this.props.phone
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
