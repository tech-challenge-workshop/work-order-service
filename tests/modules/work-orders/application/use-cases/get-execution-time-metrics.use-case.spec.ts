import { GetExecutionTimeMetricsUseCase } from '../../../../../src/modules/work-orders/application/use-cases/get-execution-time-metrics.use-case'
import { FakeWorkOrderRepository } from '../../work-order.fixtures'

describe('GetExecutionTimeMetricsUseCase', () => {
  let repository: FakeWorkOrderRepository
  let useCase: GetExecutionTimeMetricsUseCase

  beforeEach(() => {
    repository = new FakeWorkOrderRepository()
    useCase = new GetExecutionTimeMetricsUseCase(repository)
  })

  it('returns null average when there is no data', async () => {
    await expect(useCase.execute()).resolves.toEqual({ sampleSize: 0, averageSeconds: null })
  })

  it('averages the seconds between the IN_EXECUTION and FINISHED marks', async () => {
    repository.executionDurations = [
      {
        workOrderId: 'wo-1',
        startedAt: new Date('2026-07-22T10:00:00Z'),
        finishedAt: new Date('2026-07-22T11:00:00Z'),
      },
      {
        workOrderId: 'wo-2',
        startedAt: new Date('2026-07-22T10:00:00Z'),
        finishedAt: new Date('2026-07-22T10:30:00Z'),
      },
    ]

    await expect(useCase.execute()).resolves.toEqual({
      sampleSize: 2,
      averageSeconds: 2700,
    })
  })
})
