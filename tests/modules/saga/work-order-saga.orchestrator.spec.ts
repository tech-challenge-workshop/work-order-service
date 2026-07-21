import { WorkOrder } from '../../../src/modules/work-orders/domain/work-order.entity'
import { WorkOrderStatus } from '../../../src/modules/work-orders/domain/value-objects/work-order-status'
import { WorkOrderSagaOrchestrator } from '../../../src/modules/saga/application/work-order-saga.orchestrator'
import { SagaStatus } from '../../../src/modules/saga/domain/saga-instance.entity'
import { SagaMessage } from '../../../src/shared/messaging/saga-messages'
import { FakeWorkOrderRepository, openWorkOrder } from '../work-orders/work-order.fixtures'
import { FakeMessagePublisher } from '../../shared/fake-message-publisher'
import { FakeSagaInstanceRepository } from './saga.fixtures'

describe('WorkOrderSagaOrchestrator', () => {
  let sagas: FakeSagaInstanceRepository
  let workOrders: FakeWorkOrderRepository
  let publisher: FakeMessagePublisher
  let orchestrator: WorkOrderSagaOrchestrator
  let workOrder: WorkOrder

  beforeEach(() => {
    sagas = new FakeSagaInstanceRepository()
    workOrders = new FakeWorkOrderRepository()
    publisher = new FakeMessagePublisher()
    orchestrator = new WorkOrderSagaOrchestrator(sagas, workOrders, publisher)
    workOrder = openWorkOrder()
    workOrders.workOrders.push(workOrder)
  })

  function opened() {
    return orchestrator.onWorkOrderOpened({
      workOrderId: workOrder.id,
      parts: [],
      totalCents: 15000,
    })
  }

  async function driveToAwaitingApproval() {
    await opened()
    await orchestrator.onPartsReserved({ workOrderId: workOrder.id })
    await orchestrator.onQuoteGenerated({ workOrderId: workOrder.id })
  }

  async function driveToExecuting() {
    await driveToAwaitingApproval()
    await orchestrator.onQuoteApproved({ workOrderId: workOrder.id })
    await orchestrator.onPaymentConfirmed({ workOrderId: workOrder.id })
  }

  it('runs the full happy path to FINISHED with the expected command sequence', async () => {
    await driveToExecuting()
    await orchestrator.onExecutionCompleted({ workOrderId: workOrder.id })

    expect(workOrder.status).toBe(WorkOrderStatus.FINISHED)
    expect(sagas.sagas.get(workOrder.id)?.status).toBe(SagaStatus.COMPLETED)
    expect(publisher.patterns()).toEqual([
      SagaMessage.ReserveParts,
      SagaMessage.GenerateQuote,
      SagaMessage.ConfirmPayment,
      SagaMessage.StartExecution,
    ])
  })

  it('advances the work order status alongside each milestone', async () => {
    await opened()
    expect(workOrder.status).toBe(WorkOrderStatus.RECEIVED)

    await orchestrator.onPartsReserved({ workOrderId: workOrder.id })
    expect(workOrder.status).toBe(WorkOrderStatus.IN_DIAGNOSIS)

    await orchestrator.onQuoteGenerated({ workOrderId: workOrder.id })
    expect(workOrder.status).toBe(WorkOrderStatus.AWAITING_APPROVAL)

    await orchestrator.onQuoteApproved({ workOrderId: workOrder.id })
    await orchestrator.onPaymentConfirmed({ workOrderId: workOrder.id })
    expect(workOrder.status).toBe(WorkOrderStatus.IN_EXECUTION)
  })

  it('cancels without compensation when parts reservation fails', async () => {
    await opened()
    await orchestrator.onPartsReservationFailed({ workOrderId: workOrder.id })

    expect(workOrder.status).toBe(WorkOrderStatus.CANCELLED)
    expect(sagas.sagas.get(workOrder.id)?.status).toBe(SagaStatus.CANCELLED)
    expect(publisher.patterns()).not.toContain(SagaMessage.ReleaseParts)
  })

  it('compensates parts and quote when the customer rejects the quote', async () => {
    await driveToAwaitingApproval()
    await orchestrator.onQuoteRejected({ workOrderId: workOrder.id })

    expect(workOrder.status).toBe(WorkOrderStatus.CANCELLED)
    expect(publisher.patterns()).toEqual(
      expect.arrayContaining([SagaMessage.CancelQuote, SagaMessage.ReleaseParts]),
    )
    expect(publisher.patterns()).not.toContain(SagaMessage.RefundPayment)
  })

  it('compensates parts and quote when payment fails', async () => {
    await driveToAwaitingApproval()
    await orchestrator.onQuoteApproved({ workOrderId: workOrder.id })
    await orchestrator.onPaymentFailed({ workOrderId: workOrder.id })

    expect(workOrder.status).toBe(WorkOrderStatus.CANCELLED)
    expect(publisher.patterns()).toEqual(
      expect.arrayContaining([SagaMessage.CancelQuote, SagaMessage.ReleaseParts]),
    )
    expect(publisher.patterns()).not.toContain(SagaMessage.RefundPayment)
  })

  it('refunds payment and compensates the rest when execution fails', async () => {
    await driveToExecuting()
    await orchestrator.onExecutionFailed({ workOrderId: workOrder.id })

    expect(workOrder.status).toBe(WorkOrderStatus.CANCELLED)
    expect(publisher.patterns()).toEqual(
      expect.arrayContaining([
        SagaMessage.RefundPayment,
        SagaMessage.CancelQuote,
        SagaMessage.ReleaseParts,
      ]),
    )
  })

  it('is idempotent when an event is delivered twice', async () => {
    await opened()
    await orchestrator.onPartsReserved({ workOrderId: workOrder.id })
    await orchestrator.onPartsReserved({ workOrderId: workOrder.id })

    expect(workOrder.status).toBe(WorkOrderStatus.IN_DIAGNOSIS)
    expect(
      publisher.patterns().filter((pattern) => pattern === SagaMessage.GenerateQuote),
    ).toHaveLength(1)
  })

  it('ignores a duplicated work order opening', async () => {
    await opened()
    await opened()

    expect(
      publisher.patterns().filter((pattern) => pattern === SagaMessage.ReserveParts),
    ).toHaveLength(1)
  })

  it('ignores events for an already completed saga', async () => {
    await driveToExecuting()
    await orchestrator.onExecutionCompleted({ workOrderId: workOrder.id })
    const before = workOrder.status

    await orchestrator.onExecutionCompleted({ workOrderId: workOrder.id })

    expect(workOrder.status).toBe(before)
  })
})
