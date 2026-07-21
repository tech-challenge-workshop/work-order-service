import { RepairService } from '../../../../src/modules/catalog/domain/repair-service.entity'
import {
  InvalidPriceError,
  InvalidRepairServiceError,
} from '../../../../src/modules/catalog/domain/errors/repair-service.errors'
import { repairServiceWith } from '../repair-service.fixtures'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

describe('RepairService', () => {
  describe('create', () => {
    it('creates a repair service with generated uuid and timestamps', () => {
      const service = RepairService.create({ name: 'Oil change', priceCents: 15000 })

      expect(service.id).toMatch(UUID_PATTERN)
      expect(service.createdAt).toBeInstanceOf(Date)
      expect(service.updatedAt).toEqual(service.createdAt)
      expect(service.deletedAt).toBeNull()
      expect(service.price.cents).toBe(15000)
    })

    it('trims the name', () => {
      const service = RepairService.create({ name: '  Oil change  ', priceCents: 15000 })

      expect(service.name).toBe('Oil change')
    })

    it('rejects empty name', () => {
      expect(() => RepairService.create({ name: '   ', priceCents: 15000 })).toThrow(
        InvalidRepairServiceError,
      )
    })

    it('propagates InvalidPriceError from the Money value object', () => {
      expect(() => RepairService.create({ name: 'Oil change', priceCents: -1 })).toThrow(
        InvalidPriceError,
      )
    })

    it('defaults description to null and normalizes blank description to null', () => {
      expect(RepairService.create({ name: 'Oil change', priceCents: 15000 }).description).toBeNull()
      expect(
        RepairService.create({ name: 'Oil change', description: '  ', priceCents: 15000 })
          .description,
      ).toBeNull()
    })
  })

  describe('update', () => {
    it('updates provided fields and touches updatedAt', () => {
      const service = repairServiceWith()

      service.update({ name: 'Wheel alignment', priceCents: 8000 })

      expect(service.name).toBe('Wheel alignment')
      expect(service.price.cents).toBe(8000)
      expect(service.updatedAt.getTime()).toBeGreaterThan(
        new Date('2026-01-01T00:00:00Z').getTime(),
      )
    })

    it('keeps fields that were not provided', () => {
      const service = repairServiceWith()

      service.update({ priceCents: 8000 })

      expect(service.name).toBe('Oil change')
    })

    it('clears the description when null is provided', () => {
      const service = repairServiceWith()

      service.update({ description: null })

      expect(service.description).toBeNull()
    })

    it('re-validates invariants on change', () => {
      const service = repairServiceWith()

      expect(() => service.update({ name: '  ' })).toThrow(InvalidRepairServiceError)
      expect(() => service.update({ priceCents: -5 })).toThrow(InvalidPriceError)
      expect(service.name).toBe('Oil change')
    })
  })

  describe('delete', () => {
    it('sets deletedAt and isDeleted becomes true', () => {
      const service = repairServiceWith()

      service.delete()

      expect(service.deletedAt).toBeInstanceOf(Date)
      expect(service.isDeleted).toBe(true)
    })

    it('is a no-op when already deleted', () => {
      const deletedAt = new Date('2026-01-02T00:00:00Z')
      const service = repairServiceWith({ deletedAt })

      service.delete()

      expect(service.deletedAt).toEqual(deletedAt)
    })
  })
})
