import tracer from 'dd-trace'
import {
  DatadogMetricsAdapter,
  STATUS_CHANGED_METRIC,
  STATUS_DURATION_METRIC,
} from '../../../src/shared/metrics/datadog-metrics.adapter'
import { WorkOrderStatus } from '../../../src/modules/work-orders/domain/value-objects/work-order-status'

describe('DatadogMetricsAdapter', () => {
  let adapter: DatadogMetricsAdapter
  let increment: jest.SpyInstance
  let distribution: jest.SpyInstance

  beforeEach(() => {
    adapter = new DatadogMetricsAdapter()
    increment = jest.spyOn(tracer.dogstatsd, 'increment').mockImplementation(() => undefined)
    distribution = jest.spyOn(tracer.dogstatsd, 'distribution').mockImplementation(() => undefined)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('counts a transition tagged with both ends', () => {
    adapter.recordStatusChange({
      previousStatus: WorkOrderStatus.IN_DIAGNOSIS,
      newStatus: WorkOrderStatus.AWAITING_APPROVAL,
      previousStatusSeconds: 42,
    })

    expect(increment).toHaveBeenCalledWith(STATUS_CHANGED_METRIC, 1, {
      from: WorkOrderStatus.IN_DIAGNOSIS,
      to: WorkOrderStatus.AWAITING_APPROVAL,
    })
  })

  it('records how long the work order stayed in the previous status', () => {
    adapter.recordStatusChange({
      previousStatus: WorkOrderStatus.IN_EXECUTION,
      newStatus: WorkOrderStatus.FINISHED,
      previousStatusSeconds: 128.5,
    })

    expect(distribution).toHaveBeenCalledWith(STATUS_DURATION_METRIC, 128.5, {
      status: WorkOrderStatus.IN_EXECUTION,
    })
  })

  it('tags the opening transition as coming from nowhere', () => {
    adapter.recordStatusChange({
      previousStatus: null,
      newStatus: WorkOrderStatus.RECEIVED,
      previousStatusSeconds: null,
    })

    expect(increment).toHaveBeenCalledWith(STATUS_CHANGED_METRIC, 1, {
      from: 'none',
      to: WorkOrderStatus.RECEIVED,
    })
  })

  it('does not record a duration when there is no previous status', () => {
    adapter.recordStatusChange({
      previousStatus: null,
      newStatus: WorkOrderStatus.RECEIVED,
      previousStatusSeconds: null,
    })

    expect(distribution).not.toHaveBeenCalled()
  })

  it('does not record a duration when the elapsed time is unknown', () => {
    adapter.recordStatusChange({
      previousStatus: WorkOrderStatus.RECEIVED,
      newStatus: WorkOrderStatus.IN_DIAGNOSIS,
      previousStatusSeconds: null,
    })

    expect(distribution).not.toHaveBeenCalled()
  })
})
