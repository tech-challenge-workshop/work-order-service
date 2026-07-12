import {
  Document,
  DocumentType,
} from '../../../../../src/modules/customers/domain/value-objects/document'
import { InvalidDocumentError } from '../../../../../src/modules/customers/domain/errors/customer.errors'

const VALID_CPF = '39053344705'
const VALID_CPF_MASKED = '390.533.447-05'
const VALID_CNPJ = '11222333000181'
const VALID_CNPJ_MASKED = '11.222.333/0001-81'

describe('Document', () => {
  describe('create', () => {
    it('accepts a valid CPF with mask', () => {
      const document = Document.create(VALID_CPF_MASKED)

      expect(document.value).toBe(VALID_CPF)
      expect(document.type).toBe(DocumentType.CPF)
    })

    it('accepts a valid CPF digits-only', () => {
      const document = Document.create(VALID_CPF)

      expect(document.value).toBe(VALID_CPF)
      expect(document.type).toBe(DocumentType.CPF)
    })

    it('accepts a valid CNPJ with mask', () => {
      const document = Document.create(VALID_CNPJ_MASKED)

      expect(document.value).toBe(VALID_CNPJ)
      expect(document.type).toBe(DocumentType.CNPJ)
    })

    it('accepts a valid CNPJ digits-only', () => {
      const document = Document.create(VALID_CNPJ)

      expect(document.value).toBe(VALID_CNPJ)
      expect(document.type).toBe(DocumentType.CNPJ)
    })

    it('classifies type by length', () => {
      expect(Document.create(VALID_CPF).type).toBe(DocumentType.CPF)
      expect(Document.create(VALID_CNPJ).type).toBe(DocumentType.CNPJ)
    })

    it('rejects wrong first check digit', () => {
      expect(() => Document.create('39053344715')).toThrow(InvalidDocumentError)
      expect(() => Document.create('11222333000191')).toThrow(InvalidDocumentError)
    })

    it('rejects wrong second check digit', () => {
      expect(() => Document.create('39053344706')).toThrow(InvalidDocumentError)
      expect(() => Document.create('11222333000182')).toThrow(InvalidDocumentError)
    })

    it('rejects same-digit sequences', () => {
      expect(() => Document.create('00000000000')).toThrow(InvalidDocumentError)
      expect(() => Document.create('11111111111')).toThrow(InvalidDocumentError)
      expect(() => Document.create('11111111111111')).toThrow(InvalidDocumentError)
    })

    it('rejects lengths other than 11 or 14 digits', () => {
      expect(() => Document.create('123')).toThrow(InvalidDocumentError)
      expect(() => Document.create('390533447051')).toThrow(InvalidDocumentError)
      expect(() => Document.create('112223330001812')).toThrow(InvalidDocumentError)
    })

    it('rejects empty and non-numeric input', () => {
      expect(() => Document.create('')).toThrow(InvalidDocumentError)
      expect(() => Document.create('abc.def.ghi-jk')).toThrow(InvalidDocumentError)
      expect(() => Document.create('3905334470a')).toThrow(InvalidDocumentError)
    })

    it('throws InvalidDocumentError with the raw input in the message', () => {
      expect(() => Document.create('not-a-document')).toThrow('not-a-document')
    })
  })

  describe('format', () => {
    it('masks CPF as 000.000.000-00', () => {
      expect(Document.create(VALID_CPF).format()).toBe(VALID_CPF_MASKED)
    })

    it('masks CNPJ as 00.000.000/0000-00', () => {
      expect(Document.create(VALID_CNPJ).format()).toBe(VALID_CNPJ_MASKED)
    })
  })

  describe('equals', () => {
    it('is true for the same digits regardless of input formatting', () => {
      expect(Document.create(VALID_CPF).equals(Document.create(VALID_CPF_MASKED))).toBe(true)
      expect(Document.create(VALID_CPF).equals(Document.create(VALID_CNPJ))).toBe(false)
    })
  })
})
