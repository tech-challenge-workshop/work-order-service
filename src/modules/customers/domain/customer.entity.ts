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

  update(_input: UpdateCustomerInput): void {
    throw new Error('Not implemented')
  }

  delete(): void {
    throw new Error('Not implemented')
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
