import { randomUUID } from 'node:crypto'
import { Vehicle } from '../../../../src/modules/vehicles/domain/vehicle.entity'
import {
  InvalidPlateError,
  InvalidVehicleError,
} from '../../../../src/modules/vehicles/domain/errors/vehicle.errors'
import { vehicleWith, VALID_PLATE } from '../vehicle.fixtures'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

function createInput(overrides: Record<string, unknown> = {}) {
  return {
    customerId: randomUUID(),
    plate: VALID_PLATE,
    brand: 'Toyota',
    model: 'Corolla',
    year: 2024,
    ...overrides,
  }
}

describe('Vehicle', () => {
  describe('create', () => {
    it('creates a vehicle with generated uuid and timestamps', () => {
      const vehicle = Vehicle.create(createInput())

      expect(vehicle.id).toMatch(UUID_PATTERN)
      expect(vehicle.createdAt).toBeInstanceOf(Date)
      expect(vehicle.updatedAt).toEqual(vehicle.createdAt)
      expect(vehicle.deletedAt).toBeNull()
    })

    it('trims brand and model', () => {
      const vehicle = Vehicle.create(createInput({ brand: '  Toyota  ', model: '  Corolla  ' }))

      expect(vehicle.brand).toBe('Toyota')
      expect(vehicle.model).toBe('Corolla')
    })

    it('rejects empty brand or model', () => {
      expect(() => Vehicle.create(createInput({ brand: '   ' }))).toThrow(InvalidVehicleError)
      expect(() => Vehicle.create(createInput({ model: '' }))).toThrow(InvalidVehicleError)
    })

    it('rejects out-of-range or fractional years', () => {
      const nextYear = new Date().getFullYear() + 1

      expect(() => Vehicle.create(createInput({ year: 1899 }))).toThrow(InvalidVehicleError)
      expect(() => Vehicle.create(createInput({ year: nextYear + 1 }))).toThrow(InvalidVehicleError)
      expect(() => Vehicle.create(createInput({ year: 2020.5 }))).toThrow(InvalidVehicleError)
      expect(Vehicle.create(createInput({ year: nextYear })).year).toBe(nextYear)
    })

    it('propagates InvalidPlateError from the Plate value object', () => {
      expect(() => Vehicle.create(createInput({ plate: 'invalid' }))).toThrow(InvalidPlateError)
    })
  })

  describe('restore', () => {
    it('rehydrates without changing id or timestamps', () => {
      const vehicle = vehicleWith()

      expect(vehicle.createdAt).toEqual(new Date('2026-01-01T00:00:00Z'))
      expect(vehicle.updatedAt).toEqual(new Date('2026-01-01T00:00:00Z'))
    })
  })

  describe('update', () => {
    it('updates provided fields and touches updatedAt', () => {
      const vehicle = vehicleWith()

      vehicle.update({ brand: 'Honda', model: 'Civic', year: 2023 })

      expect(vehicle.brand).toBe('Honda')
      expect(vehicle.model).toBe('Civic')
      expect(vehicle.year).toBe(2023)
      expect(vehicle.updatedAt.getTime()).toBeGreaterThan(
        new Date('2026-01-01T00:00:00Z').getTime(),
      )
    })

    it('keeps fields that were not provided', () => {
      const vehicle = vehicleWith()

      vehicle.update({ brand: 'Honda' })

      expect(vehicle.model).toBe('Corolla')
      expect(vehicle.year).toBe(2024)
    })

    it('re-validates invariants on change', () => {
      const vehicle = vehicleWith()

      expect(() => vehicle.update({ brand: '  ' })).toThrow(InvalidVehicleError)
      expect(() => vehicle.update({ year: 1800 })).toThrow(InvalidVehicleError)
      expect(vehicle.brand).toBe('Toyota')
    })

    it('does not expose any way to change plate or owner', () => {
      const vehicle = vehicleWith()
      const originalCustomerId = vehicle.customerId

      vehicle.update({ brand: 'Honda' })

      expect(vehicle.plate.value).toBe(VALID_PLATE)
      expect(vehicle.customerId).toBe(originalCustomerId)
    })
  })

  describe('delete', () => {
    it('sets deletedAt and isDeleted becomes true', () => {
      const vehicle = vehicleWith()

      vehicle.delete()

      expect(vehicle.deletedAt).toBeInstanceOf(Date)
      expect(vehicle.isDeleted).toBe(true)
    })

    it('is a no-op when already deleted', () => {
      const deletedAt = new Date('2026-01-02T00:00:00Z')
      const vehicle = vehicleWith({ deletedAt })

      vehicle.delete()

      expect(vehicle.deletedAt).toEqual(deletedAt)
    })
  })
})
