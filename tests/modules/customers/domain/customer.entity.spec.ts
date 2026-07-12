import { Customer } from '../../../../src/modules/customers/domain/customer.entity'
import {
  InvalidCustomerError,
  InvalidDocumentError,
} from '../../../../src/modules/customers/domain/errors/customer.errors'
import {
  Document,
  DocumentType,
} from '../../../../src/modules/customers/domain/value-objects/document'

const VALID_CPF = '39053344705'
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

describe('Customer', () => {
  describe('create', () => {
    it('creates a customer with generated uuid and timestamps', () => {
      const customer = Customer.create({ name: 'John Doe', document: VALID_CPF })

      expect(customer.id).toMatch(UUID_PATTERN)
      expect(customer.createdAt).toBeInstanceOf(Date)
      expect(customer.updatedAt).toEqual(customer.createdAt)
      expect(customer.document.type).toBe(DocumentType.CPF)
    })

    it('trims the name', () => {
      const customer = Customer.create({ name: '  John Doe  ', document: VALID_CPF })

      expect(customer.name).toBe('John Doe')
    })

    it('rejects empty or whitespace-only name', () => {
      expect(() => Customer.create({ name: '', document: VALID_CPF })).toThrow(InvalidCustomerError)
      expect(() => Customer.create({ name: '   ', document: VALID_CPF })).toThrow(
        InvalidCustomerError,
      )
    })

    it('propagates InvalidDocumentError from the Document value object', () => {
      expect(() => Customer.create({ name: 'John Doe', document: 'invalid' })).toThrow(
        InvalidDocumentError,
      )
    })

    it('defaults email and phone to null when not provided', () => {
      const customer = Customer.create({ name: 'John Doe', document: VALID_CPF })

      expect(customer.email).toBeNull()
      expect(customer.phone).toBeNull()
    })

    it('starts with deletedAt null', () => {
      const customer = Customer.create({ name: 'John Doe', document: VALID_CPF })

      expect(customer.deletedAt).toBeNull()
      expect(customer.isDeleted).toBe(false)
    })
  })

  describe('restore', () => {
    it('rehydrates without changing id or timestamps', () => {
      const props = {
        id: 'e7b8f0f0-1234-4abc-8def-1234567890ab',
        name: 'John Doe',
        document: Document.create(VALID_CPF),
        email: 'john@example.com',
        phone: null,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-02T00:00:00Z'),
        deletedAt: null,
      }

      const customer = Customer.restore(props)

      expect(customer.id).toBe(props.id)
      expect(customer.createdAt).toEqual(props.createdAt)
      expect(customer.updatedAt).toEqual(props.updatedAt)
    })
  })

  describe('update', () => {
    it.todo('updates name and touches updatedAt')
    it.todo('keeps fields that were not provided (undefined)')
    it.todo('clears email/phone when null is provided')
    it.todo('re-validates name invariant on change')
    it.todo('does not expose any way to change the document')
  })

  describe('delete', () => {
    it.todo('sets deletedAt and isDeleted becomes true')
    it.todo('is a no-op when already deleted (deletedAt unchanged)')
  })
})
