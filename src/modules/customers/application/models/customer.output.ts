import { Customer } from '../../domain/customer.entity'
import { DocumentType } from '../../domain/value-objects/document'

export interface CustomerOutput {
  id: string
  name: string
  document: string
  documentType: DocumentType
  email: string | null
  phone: string | null
  createdAt: Date
  updatedAt: Date
}

export function toCustomerOutput(customer: Customer): CustomerOutput {
  return {
    id: customer.id,
    name: customer.name,
    document: customer.document.format(),
    documentType: customer.document.type,
    email: customer.email,
    phone: customer.phone,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  }
}
