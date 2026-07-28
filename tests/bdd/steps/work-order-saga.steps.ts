import assert from 'node:assert/strict'
import { Before, Given, Then, When, World, setWorldConstructor } from '@cucumber/cucumber'
import { WorkOrder } from '../../../src/modules/work-orders/domain/work-order.entity'
import { WorkOrderStatus } from '../../../src/modules/work-orders/domain/value-objects/work-order-status'
import { WorkOrderSagaOrchestrator } from '../../../src/modules/saga/application/work-order-saga.orchestrator'
import { SagaStatus } from '../../../src/modules/saga/domain/saga-instance.entity'
import { SagaMessage } from '../../../src/shared/messaging/saga-messages'
import {
  FakeWorkOrderRepository,
  openWorkOrder,
} from '../../modules/work-orders/work-order.fixtures'
import { FakeMessagePublisher } from '../../shared/fake-message-publisher'
import { FakeMetricsPort } from '../../shared/metrics/fake-metrics.port'
import { FakeNotificationPort } from '../../shared/notifications/fake-notification.port'
import { FakeTracingPort } from '../../shared/observability/fake-tracing.port'
import { FakeSagaInstanceRepository } from '../../modules/saga/saga.fixtures'

// Drives the real orchestrator against the same in-memory fakes the unit tests
// use. The saga spans three services in production, but the transaction is
// coordinated entirely here — every step is a message this orchestrator sends
// or reacts to, so replaying those messages exercises the whole flow.
class SagaWorld extends World {
  sagas!: FakeSagaInstanceRepository
  workOrders!: FakeWorkOrderRepository
  publisher!: FakeMessagePublisher
  notifier!: FakeNotificationPort
  metrics!: FakeMetricsPort
  tracing!: FakeTracingPort
  orchestrator!: WorkOrderSagaOrchestrator
  workOrder!: WorkOrder

  get workOrderId(): string {
    return this.workOrder.id
  }

  get currentStatus(): WorkOrderStatus {
    const stored = this.workOrders.workOrders.find((order) => order.id === this.workOrderId)
    assert.ok(stored, 'work order disappeared from the repository')
    return stored.status
  }

  published(message: string): number {
    return this.publisher.published.filter((entry) => entry.pattern === message).length
  }

  assertPublished(message: string): void {
    assert.ok(this.published(message) > 0, `expected ${message} to have been published`)
  }
}

setWorldConstructor(SagaWorld)

Before(function (this: SagaWorld) {
  this.sagas = new FakeSagaInstanceRepository()
  this.workOrders = new FakeWorkOrderRepository()
  this.publisher = new FakeMessagePublisher()
  this.notifier = new FakeNotificationPort()
  this.metrics = new FakeMetricsPort()
  this.tracing = new FakeTracingPort()
  this.orchestrator = new WorkOrderSagaOrchestrator(
    this.sagas,
    this.workOrders,
    this.publisher,
    this.notifier,
    this.metrics,
    this.tracing,
  )
})

Given('a work order was opened for a customer with a vehicle', async function (this: SagaWorld) {
  this.workOrder = openWorkOrder()
  this.workOrders.workOrders.push(this.workOrder)
  await this.orchestrator.onWorkOrderOpened({
    workOrderId: this.workOrderId,
    parts: [{ partId: 'part-1', quantity: 2 }],
    totalCents: 15000,
  })
})

async function reserveParts(world: SagaWorld): Promise<void> {
  await world.orchestrator.onPartsReserved({ workOrderId: world.workOrderId })
}

async function generateQuote(world: SagaWorld): Promise<void> {
  await world.orchestrator.onQuoteGenerated({ workOrderId: world.workOrderId })
}

async function approveQuote(world: SagaWorld): Promise<void> {
  await world.orchestrator.onQuoteApproved({ workOrderId: world.workOrderId })
}

async function confirmPayment(world: SagaWorld): Promise<void> {
  await world.orchestrator.onPaymentConfirmed({ workOrderId: world.workOrderId })
}

// Cucumber matches on the phrase, not on the keyword, so each of these is
// declared once and reads correctly whether the feature says Given or When.
Given('the parts are reserved', async function (this: SagaWorld) {
  await reserveParts(this)
})

Given('the parts are reserved again', async function (this: SagaWorld) {
  await reserveParts(this)
})

Given('the quote is generated', async function (this: SagaWorld) {
  await generateQuote(this)
})

Given('the customer approves the quote', async function (this: SagaWorld) {
  await approveQuote(this)
})

Given('the payment is confirmed', async function (this: SagaWorld) {
  await confirmPayment(this)
})

When('the parts reservation fails', async function (this: SagaWorld) {
  await this.orchestrator.onPartsReservationFailed({ workOrderId: this.workOrderId })
})

When('the customer rejects the quote', async function (this: SagaWorld) {
  await this.orchestrator.onQuoteRejected({ workOrderId: this.workOrderId })
})

When('the payment fails', async function (this: SagaWorld) {
  await this.orchestrator.onPaymentFailed({ workOrderId: this.workOrderId })
})

When('the execution is completed', async function (this: SagaWorld) {
  await this.orchestrator.onExecutionCompleted({ workOrderId: this.workOrderId })
})

When('the execution fails', async function (this: SagaWorld) {
  await this.orchestrator.onExecutionFailed({ workOrderId: this.workOrderId })
})

const statusSteps: Record<string, WorkOrderStatus> = {
  'in diagnosis': WorkOrderStatus.IN_DIAGNOSIS,
  'awaiting approval': WorkOrderStatus.AWAITING_APPROVAL,
  'in execution': WorkOrderStatus.IN_EXECUTION,
  finished: WorkOrderStatus.FINISHED,
  cancelled: WorkOrderStatus.CANCELLED,
}

Then('the work order is {word}', function (this: SagaWorld, status: string) {
  const expected = statusSteps[status]
  assert.ok(expected, `unknown status in the feature file: ${status}`)
  assert.equal(this.currentStatus, expected)
})

Then('the work order is {word} {word}', function (this: SagaWorld, a: string, b: string) {
  const expected = statusSteps[`${a} ${b}`]
  assert.ok(expected, `unknown status in the feature file: ${a} ${b}`)
  assert.equal(this.currentStatus, expected)
})

Then('the workshop is asked to generate the quote', function (this: SagaWorld) {
  this.assertPublished(SagaMessage.GenerateQuote)
})

Then('the workshop was asked to generate the quote only once', function (this: SagaWorld) {
  assert.equal(this.published(SagaMessage.GenerateQuote), 1)
})

Then('the payment is requested', function (this: SagaWorld) {
  this.assertPublished(SagaMessage.ConfirmPayment)
})

Then('the workshop is asked to start the execution', function (this: SagaWorld) {
  this.assertPublished(SagaMessage.StartExecution)
})

Then('the parts are released', function (this: SagaWorld) {
  this.assertPublished(SagaMessage.ReleaseParts)
})

Then('the quote is cancelled', function (this: SagaWorld) {
  this.assertPublished(SagaMessage.CancelQuote)
})

Then('the payment is refunded', function (this: SagaWorld) {
  this.assertPublished(SagaMessage.RefundPayment)
})

Then('no compensation was issued', function (this: SagaWorld) {
  assert.equal(this.published(SagaMessage.ReleaseParts), 0)
  assert.equal(this.published(SagaMessage.CancelQuote), 0)
  assert.equal(this.published(SagaMessage.RefundPayment), 0)
})

const sagaOutcomes: Record<string, SagaStatus> = {
  completed: SagaStatus.COMPLETED,
  cancelled: SagaStatus.CANCELLED,
}

Then('the saga is {word}', async function (this: SagaWorld, outcome: string) {
  const expected = sagaOutcomes[outcome]
  assert.ok(expected, `unknown saga outcome in the feature file: ${outcome}`)
  const saga = await this.sagas.findByWorkOrderId(this.workOrderId)
  assert.ok(saga, 'saga instance was never created')
  assert.equal(saga.status, expected)
})

Then('the customer was notified of every status change', function (this: SagaWorld) {
  const notified = this.notifier.notifications.map((entry) => entry.newStatus)
  assert.deepEqual(notified, [
    WorkOrderStatus.IN_DIAGNOSIS,
    WorkOrderStatus.AWAITING_APPROVAL,
    WorkOrderStatus.IN_EXECUTION,
    WorkOrderStatus.FINISHED,
  ])
})
