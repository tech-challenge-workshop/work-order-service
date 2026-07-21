import { Money } from '../../../../../src/modules/catalog/domain/value-objects/money'
import { InvalidPriceError } from '../../../../../src/modules/catalog/domain/errors/repair-service.errors'

describe('Money', () => {
  describe('fromCents', () => {
    it('accepts zero and positive integer cents', () => {
      expect(Money.fromCents(0).cents).toBe(0)
      expect(Money.fromCents(15000).cents).toBe(15000)
    })

    it('rejects negative amounts', () => {
      expect(() => Money.fromCents(-1)).toThrow(InvalidPriceError)
    })

    it('rejects fractional amounts', () => {
      expect(() => Money.fromCents(10.5)).toThrow(InvalidPriceError)
    })

    it('rejects non-finite amounts', () => {
      expect(() => Money.fromCents(Number.NaN)).toThrow(InvalidPriceError)
      expect(() => Money.fromCents(Number.POSITIVE_INFINITY)).toThrow(InvalidPriceError)
    })

    it('rejects amounts above the sane maximum', () => {
      expect(() => Money.fromCents(100_000_000_01)).toThrow(InvalidPriceError)
    })
  })

  describe('equals', () => {
    it('is true for the same amount', () => {
      expect(Money.fromCents(15000).equals(Money.fromCents(15000))).toBe(true)
      expect(Money.fromCents(15000).equals(Money.fromCents(20000))).toBe(false)
    })
  })
})
