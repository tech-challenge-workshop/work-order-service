import { WorkOrder } from '../../../../../src/modules/work-orders/domain/work-order.entity'
import { WorkOrderStatus } from '../../../../../src/modules/work-orders/domain/value-objects/work-order-status'
import { ListWorkOrdersUseCase } from '../../../../../src/modules/work-orders/application/use-cases/list-work-orders.use-case'
import { FakeWorkOrderRepository, openWorkOrder } from '../../work-order.fixtures'

function atStatus(target: WorkOrderStatus): WorkOrder {
  const workOrder = openWorkOrder()
  if (target === WorkOrderStatus.RECEIVED) return workOrder
  workOrder.startDiagnosis()
  if (target === WorkOrderStatus.IN_DIAGNOSIS) return workOrder
  workOrder.requestApproval()
  if (target === WorkOrderStatus.AWAITING_APPROVAL) return workOrder
  workOrder.startExecution()
  if (target === WorkOrderStatus.IN_EXECUTION) return workOrder
  workOrder.finish()
  return workOrder
}

describe('ListWorkOrdersUseCase', () => {
  let repository: FakeWorkOrderRepository
  let useCase: ListWorkOrdersUseCase

  beforeEach(() => {
    repository = new FakeWorkOrderRepository()
    useCase = new ListWorkOrdersUseCase(repository)
  })

  it('orders by status priority and excludes terminal work orders', async () => {
    repository.workOrders.push(
      atStatus(WorkOrderStatus.RECEIVED),
      atStatus(WorkOrderStatus.IN_EXECUTION),
      atStatus(WorkOrderStatus.IN_DIAGNOSIS),
      atStatus(WorkOrderStatus.AWAITING_APPROVAL),
      atStatus(WorkOrderStatus.FINISHED),
    )

    const output = await useCase.execute({ page: 1, perPage: 10 })

    expect(output.total).toBe(4)
    expect(output.items.map((item) => item.status)).toEqual([
      WorkOrderStatus.IN_EXECUTION,
      WorkOrderStatus.AWAITING_APPROVAL,
      WorkOrderStatus.IN_DIAGNOSIS,
      WorkOrderStatus.RECEIVED,
    ])
  })

  it('filters by a specific status', async () => {
    repository.workOrders.push(
      atStatus(WorkOrderStatus.RECEIVED),
      atStatus(WorkOrderStatus.IN_EXECUTION),
    )

    const output = await useCase.execute({ page: 1, perPage: 10, status: WorkOrderStatus.RECEIVED })

    expect(output.total).toBe(1)
    expect(output.items[0].status).toBe(WorkOrderStatus.RECEIVED)
  })
})
