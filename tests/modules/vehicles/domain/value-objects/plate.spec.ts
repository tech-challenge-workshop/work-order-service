import { Plate } from '../../../../../src/modules/vehicles/domain/value-objects/plate'
import { InvalidPlateError } from '../../../../../src/modules/vehicles/domain/errors/vehicle.errors'

describe('Plate', () => {
  describe('create', () => {
    it('accepts an old-format plate', () => {
      expect(Plate.create('ABC1234').value).toBe('ABC1234')
    })

    it('accepts a Mercosul plate', () => {
      expect(Plate.create('ABC1D23').value).toBe('ABC1D23')
    })

    it('normalizes lowercase and hyphen', () => {
      expect(Plate.create('abc-1234').value).toBe('ABC1234')
      expect(Plate.create(' abc1d23 ').value).toBe('ABC1D23')
    })

    it('rejects malformed plates', () => {
      expect(() => Plate.create('ABCD123')).toThrow(InvalidPlateError)
      expect(() => Plate.create('AB12345')).toThrow(InvalidPlateError)
      expect(() => Plate.create('ABC12345')).toThrow(InvalidPlateError)
      expect(() => Plate.create('1234ABC')).toThrow(InvalidPlateError)
      expect(() => Plate.create('ABC12D3')).toThrow(InvalidPlateError)
      expect(() => Plate.create('')).toThrow(InvalidPlateError)
    })

    it('throws InvalidPlateError with the raw input in the message', () => {
      expect(() => Plate.create('not-a-plate')).toThrow('not-a-plate')
    })
  })

  describe('equals', () => {
    it('is true for the same plate regardless of input formatting', () => {
      expect(Plate.create('ABC1234').equals(Plate.create('abc-1234'))).toBe(true)
      expect(Plate.create('ABC1234').equals(Plate.create('ABC1D23'))).toBe(false)
    })
  })
})
