import { WorkOrderNotFoundError } from '../../../../../src/modules/work-orders/domain/errors/work-order.errors'
import { GetWorkOrderUseCase } from '../../../../../src/modules/work-orders/application/use-cases/get-work-order.use-case'
import { FakeWorkOrderRepository, openWorkOrder } from '../../work-order.fixtures'

describe('GetWorkOrderUseCase', () => {
  let repository: FakeWorkOrderRepository
  let useCase: GetWorkOrderUseCase

  beforeEach(() => {
    repository = new FakeWorkOrderRepository()
    useCase = new GetWorkOrderUseCase(repository)
  })

  it('returns the work order output including items and history', async () => {
    const workOrder = openWorkOrder()
    repository.workOrders.push(workOrder)

    const output = await useCase.execute(workOrder.id)

    expect(output).toMatchObject({ id: workOrder.id, totalCents: workOrder.totalCents })
    expect(output.items).toHaveLength(1)
    expect(output.history).toHaveLength(1)
  })

  it('throws WorkOrderNotFoundError when the id does not exist', async () => {
    await expect(useCase.execute('missing-id')).rejects.toThrow(WorkOrderNotFoundError)
  })
})
