import { InvalidPriceError } from '../errors/repair-service.errors'

const MAX_CENTS = 100_000_000_00

export class Money {
  private constructor(readonly cents: number) {}

  static fromCents(cents: number): Money {
    if (!Number.isInteger(cents) || cents < 0 || cents > MAX_CENTS) {
      throw new InvalidPriceError(cents)
    }

    return new Money(cents)
  }

  equals(other: Money): boolean {
    return this.cents === other.cents
  }
}
