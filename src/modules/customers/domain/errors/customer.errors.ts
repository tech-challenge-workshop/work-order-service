export class InvalidDocumentError extends Error {
  constructor(raw: string) {
    super(`Invalid CPF/CNPJ document: ${raw}`)
    this.name = 'InvalidDocumentError'
  }
}

export class InvalidCustomerError extends Error {
  constructor(reason: string) {
    super(`Invalid customer: ${reason}`)
    this.name = 'InvalidCustomerError'
  }
}

export class CustomerNotFoundError extends Error {
  constructor(id: string) {
    super(`Customer not found: ${id}`)
    this.name = 'CustomerNotFoundError'
  }
}

export class DocumentAlreadyInUseError extends Error {
  constructor() {
    super('A customer with this document already exists')
    this.name = 'DocumentAlreadyInUseError'
  }
}
