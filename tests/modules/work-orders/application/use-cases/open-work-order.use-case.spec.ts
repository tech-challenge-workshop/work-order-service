import { randomUUID } from 'node:crypto'
import { CustomerNotFoundError } from '../../../../../src/modules/customers/domain/errors/customer.errors'
import { VehicleNotFoundError } from '../../../../../src/modules/vehicles/domain/errors/vehicle.errors'
import { RepairServiceNotFoundError } from '../../../../../src/modules/catalog/domain/errors/repair-service.errors'
import {
  InvalidWorkOrderError,
  PartNotFoundError,
  VehicleDoesNotBelongToCustomerError,
} from '../../../../../src/modules/work-orders/domain/errors/work-order.errors'
import { WorkOrderStatus } from '../../../../../src/modules/work-orders/domain/value-objects/work-order-status'
import { WorkOrderItemKind } from '../../../../../src/modules/work-orders/domain/value-objects/work-order-item'
import { OpenWorkOrderUseCase } from '../../../../../src/modules/work-orders/application/use-cases/open-work-order.use-case'
import { customerWith, FakeCustomerRepository } from '../../../customers/customer.fixtures'
import { FakeVehicleRepository, vehicleWith } from '../../../vehicles/vehicle.fixtures'
import {
  FakeRepairServiceRepository,
  repairServiceWith,
} from '../../../catalog/repair-service.fixtures'
import { FakePartCatalogGateway, FakeWorkOrderRepository } from '../../work-order.fixtures'
import { Plate } from '../../../../../src/modules/vehicles/domain/value-objects/plate'
import { FakeMessagePublisher } from '../../../../shared/fake-message-publisher'
import { FakeNotificationPort } from '../../../../shared/notifications/fake-notification.port'
import { SagaMessage } from '../../../../../src/shared/messaging/saga-messages'

describe('OpenWorkOrderUseCase', () => {
  let workOrders: FakeWorkOrderRepository
  let customers: FakeCustomerRepository
  let vehicles: FakeVehicleRepository
  let repairServices: FakeRepairServiceRepository
  let partCatalog: FakePartCatalogGateway
  let publisher: FakeMessagePublisher
  let notifier: FakeNotificationPort
  let useCase: OpenWorkOrderUseCase

  beforeEach(() => {
    workOrders = new FakeWorkOrderRepository()
    customers = new FakeCustomerRepository()
    vehicles = new FakeVehicleRepository()
    repairServices = new FakeRepairServiceRepository()
    partCatalog = new FakePartCatalogGateway()
    publisher = new FakeMessagePublisher()
    notifier = new FakeNotificationPort()
    useCase = new OpenWorkOrderUseCase(
      workOrders,
      customers,
      vehicles,
      repairServices,
      partCatalog,
      publisher,
      notifier,
    )
  })

  function seedCustomerWithVehicle() {
    const customer = customerWith()
    const vehicle = vehicleWith({ customerId: customer.id })
    customers.customers.push(customer)
    vehicles.vehicles.push(vehicle)
    return { customer, vehicle }
  }

  it('opens a work order with catalog services and returns the snapshot', async () => {
    const { customer, vehicle } = seedCustomerWithVehicle()
    const service = repairServiceWith({ name: 'Oil change' })
    repairServices.repairServices.push(service)

    const output = await useCase.execute({
      customerId: customer.id,
      vehicleId: vehicle.id,
      serviceIds: [service.id],
    })

    expect(workOrders.workOrders).toHaveLength(1)
    expect(output.status).toBe(WorkOrderStatus.RECEIVED)
    expect(output.items).toHaveLength(1)
    expect(output.items[0]).toMatchObject({
      kind: WorkOrderItemKind.SERVICE,
      referenceId: service.id,
      description: 'Oil change',
      unitPriceCents: 15000,
      quantity: 1,
    })
    expect(output.totalCents).toBe(15000)
    expect(publisher.patterns()).toContain(SagaMessage.WorkOrderOpened)
    expect(publisher.lastPayload()).toMatchObject({ workOrderId: output.id, totalCents: 15000 })
    expect(notifier.notifications).toHaveLength(1)
    expect(notifier.notifications[0]).toMatchObject({
      workOrderId: output.id,
      customerId: customer.id,
      previousStatus: null,
      newStatus: WorkOrderStatus.RECEIVED,
    })
  })

  it('resolves parts from the catalog gateway with the requested quantity', async () => {
    const { customer, vehicle } = seedCustomerWithVehicle()
    const service = repairServiceWith()
    repairServices.repairServices.push(service)
    const partId = randomUUID()
    partCatalog.register({ partId, description: 'Brake pad', unitPriceCents: 5000 })

    const output = await useCase.execute({
      customerId: customer.id,
      vehicleId: vehicle.id,
      serviceIds: [service.id],
      parts: [{ partId, quantity: 2 }],
    })

    expect(output.items).toHaveLength(2)
    expect(output.items[1]).toMatchObject({
      kind: WorkOrderItemKind.PART,
      referenceId: partId,
      description: 'Brake pad',
      unitPriceCents: 5000,
      quantity: 2,
    })
    expect(output.totalCents).toBe(15000 + 10000)
  })

  it('throws CustomerNotFoundError when the customer does not exist', async () => {
    await expect(
      useCase.execute({ customerId: randomUUID(), vehicleId: randomUUID(), serviceIds: [] }),
    ).rejects.toThrow(CustomerNotFoundError)
    expect(workOrders.workOrders).toHaveLength(0)
  })

  it('throws VehicleNotFoundError when the vehicle does not exist', async () => {
    const customer = customerWith()
    customers.customers.push(customer)

    await expect(
      useCase.execute({ customerId: customer.id, vehicleId: randomUUID(), serviceIds: [] }),
    ).rejects.toThrow(VehicleNotFoundError)
  })

  it('throws VehicleDoesNotBelongToCustomerError when the vehicle has another owner', async () => {
    const customer = customerWith()
    const vehicle = vehicleWith({ customerId: randomUUID(), plate: Plate.create('XYZ9Z99') })
    customers.customers.push(customer)
    vehicles.vehicles.push(vehicle)

    await expect(
      useCase.execute({ customerId: customer.id, vehicleId: vehicle.id, serviceIds: [] }),
    ).rejects.toThrow(VehicleDoesNotBelongToCustomerError)
  })

  it('throws RepairServiceNotFoundError when a service is missing', async () => {
    const { customer, vehicle } = seedCustomerWithVehicle()

    await expect(
      useCase.execute({
        customerId: customer.id,
        vehicleId: vehicle.id,
        serviceIds: [randomUUID()],
      }),
    ).rejects.toThrow(RepairServiceNotFoundError)
    expect(workOrders.workOrders).toHaveLength(0)
  })

  it('throws PartNotFoundError when a requested part is not in the catalog', async () => {
    const { customer, vehicle } = seedCustomerWithVehicle()
    const service = repairServiceWith()
    repairServices.repairServices.push(service)

    await expect(
      useCase.execute({
        customerId: customer.id,
        vehicleId: vehicle.id,
        serviceIds: [service.id],
        parts: [{ partId: randomUUID(), quantity: 1 }],
      }),
    ).rejects.toThrow(PartNotFoundError)
  })

  it('rejects opening a work order with no services and no parts', async () => {
    const { customer, vehicle } = seedCustomerWithVehicle()

    await expect(
      useCase.execute({ customerId: customer.id, vehicleId: vehicle.id, serviceIds: [] }),
    ).rejects.toThrow(InvalidWorkOrderError)
  })
})
