import { InvalidDocumentError } from '../errors/customer.errors'

export enum DocumentType {
  CPF = 'CPF',
  CNPJ = 'CNPJ',
}

const CPF_LENGTH = 11
const CNPJ_LENGTH = 14

const CPF_WEIGHTS = [
  [10, 9, 8, 7, 6, 5, 4, 3, 2],
  [11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
]

const CNPJ_WEIGHTS = [
  [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
]

function checkDigit(digits: string, weights: number[]): number {
  const sum = weights.reduce((total, weight, index) => total + Number(digits[index]) * weight, 0)
  const remainder = sum % 11
  return remainder < 2 ? 0 : 11 - remainder
}

function hasValidCheckDigits(digits: string, weightTable: number[][]): boolean {
  return weightTable.every(
    (weights) => Number(digits[weights.length]) === checkDigit(digits, weights),
  )
}

function isSameDigitSequence(digits: string): boolean {
  return /^(\d)\1+$/.test(digits)
}

export class Document {
  private constructor(
    readonly value: string,
    readonly type: DocumentType,
  ) {}

  static create(raw: string): Document {
    const digits = raw.replace(/[.\-/\s]/g, '')

    if (!/^\d+$/.test(digits) || isSameDigitSequence(digits)) {
      throw new InvalidDocumentError(raw)
    }

    if (digits.length === CPF_LENGTH && hasValidCheckDigits(digits, CPF_WEIGHTS)) {
      return new Document(digits, DocumentType.CPF)
    }

    if (digits.length === CNPJ_LENGTH && hasValidCheckDigits(digits, CNPJ_WEIGHTS)) {
      return new Document(digits, DocumentType.CNPJ)
    }

    throw new InvalidDocumentError(raw)
  }

  format(): string {
    if (this.type === DocumentType.CPF) {
      return `${this.value.slice(0, 3)}.${this.value.slice(3, 6)}.${this.value.slice(6, 9)}-${this.value.slice(9)}`
    }

    return `${this.value.slice(0, 2)}.${this.value.slice(2, 5)}.${this.value.slice(5, 8)}/${this.value.slice(8, 12)}-${this.value.slice(12)}`
  }

  equals(other: Document): boolean {
    return this.value === other.value
  }
}
