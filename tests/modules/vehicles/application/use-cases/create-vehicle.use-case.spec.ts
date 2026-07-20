import { randomUUID } from 'node:crypto'
import { CustomerNotFoundError } from '../../../../../src/modules/customers/domain/errors/customer.errors'
import {
  InvalidPlateError,
  PlateAlreadyInUseError,
} from '../../../../../src/modules/vehicles/domain/errors/vehicle.errors'
import { CreateVehicleUseCase } from '../../../../../src/modules/vehicles/application/use-cases/create-vehicle.use-case'
import { customerWith, FakeCustomerRepository } from '../../../customers/customer.fixtures'
import { FakeVehicleRepository, vehicleWith, VALID_PLATE } from '../../vehicle.fixtures'

describe('CreateVehicleUseCase', () => {
  let vehicles: FakeVehicleRepository
  let customers: FakeCustomerRepository
  let useCase: CreateVehicleUseCase

  beforeEach(() => {
    vehicles = new FakeVehicleRepository()
    customers = new FakeCustomerRepository()
    useCase = new CreateVehicleUseCase(vehicles, customers)
  })

  function commandFor(customerId: string, overrides: Record<string, unknown> = {}) {
    return {
      customerId,
      plate: VALID_PLATE,
      brand: 'Toyota',
      model: 'Corolla',
      year: 2024,
      ...overrides,
    }
  }

  it('persists a valid vehicle and returns the output model', async () => {
    const owner = customerWith()
    customers.customers.push(owner)

    const output = await useCase.execute(commandFor(owner.id))

    expect(vehicles.vehicles).toHaveLength(1)
    expect(output).toMatchObject({
      customerId: owner.id,
      plate: VALID_PLATE,
      brand: 'Toyota',
      model: 'Corolla',
      year: 2024,
    })
    expect(output.id).toBe(vehicles.vehicles[0].id)
  })

  it('normalizes the plate in the output', async () => {
    const owner = customerWith()
    customers.customers.push(owner)

    const output = await useCase.execute(commandFor(owner.id, { plate: 'abc-1234' }))

    expect(output.plate).toBe(VALID_PLATE)
  })

  it('throws CustomerNotFoundError when the owner does not exist', async () => {
    await expect(useCase.execute(commandFor(randomUUID()))).rejects.toThrow(CustomerNotFoundError)
    expect(vehicles.vehicles).toHaveLength(0)
  })

  it('throws CustomerNotFoundError when the owner is soft-deleted', async () => {
    const owner = customerWith({ deletedAt: new Date('2026-01-02T00:00:00Z') })
    customers.customers.push(owner)

    await expect(useCase.execute(commandFor(owner.id))).rejects.toThrow(CustomerNotFoundError)
  })

  it('throws PlateAlreadyInUseError when the plate is already registered', async () => {
    const owner = customerWith()
    customers.customers.push(owner)
    vehicles.vehicles.push(vehicleWith())

    await expect(useCase.execute(commandFor(owner.id, { plate: 'abc-1234' }))).rejects.toThrow(
      PlateAlreadyInUseError,
    )
    expect(vehicles.vehicles).toHaveLength(1)
  })

  it('considers soft-deleted vehicles in the plate uniqueness check', async () => {
    const owner = customerWith()
    customers.customers.push(owner)
    vehicles.vehicles.push(vehicleWith({ deletedAt: new Date('2026-01-02T00:00:00Z') }))

    await expect(useCase.execute(commandFor(owner.id))).rejects.toThrow(PlateAlreadyInUseError)
  })

  it('propagates domain validation errors without persisting', async () => {
    const owner = customerWith()
    customers.customers.push(owner)

    await expect(useCase.execute(commandFor(owner.id, { plate: 'nope' }))).rejects.toThrow(
      InvalidPlateError,
    )
    expect(vehicles.vehicles).toHaveLength(0)
  })
})
