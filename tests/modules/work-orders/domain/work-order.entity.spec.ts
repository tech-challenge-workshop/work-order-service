import { randomUUID } from 'node:crypto'
import { WorkOrder } from '../../../../src/modules/work-orders/domain/work-order.entity'
import { WorkOrderStatus } from '../../../../src/modules/work-orders/domain/value-objects/work-order-status'
import {
  InvalidWorkOrderError,
  InvalidWorkOrderTransitionError,
} from '../../../../src/modules/work-orders/domain/errors/work-order.errors'
import { openWorkOrder, serviceItem } from '../work-order.fixtures'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

describe('WorkOrder', () => {
  describe('open', () => {
    it('opens in RECEIVED status with an initial history entry', () => {
      const workOrder = openWorkOrder()

      expect(workOrder.id).toMatch(UUID_PATTERN)
      expect(workOrder.status).toBe(WorkOrderStatus.RECEIVED)
      expect(workOrder.history).toHaveLength(1)
      expect(workOrder.history[0].status).toBe(WorkOrderStatus.RECEIVED)
    })

    it('computes the total from item subtotals', () => {
      const workOrder = openWorkOrder({
        items: [
          serviceItem({ unitPriceCents: 15000, quantity: 1 }),
          serviceItem({ unitPriceCents: 5000, quantity: 3 }),
        ],
      })

      expect(workOrder.totalCents).toBe(30000)
    })

    it('rejects opening without any item', () => {
      expect(() =>
        WorkOrder.open({ customerId: randomUUID(), vehicleId: randomUUID(), items: [] }),
      ).toThrow(InvalidWorkOrderError)
    })
  })

  describe('transitions', () => {
    it('advances through the full lifecycle recording history', () => {
      const workOrder = openWorkOrder()

      workOrder.startDiagnosis()
      workOrder.requestApproval()
      workOrder.startExecution()
      workOrder.finish()
      workOrder.deliver()

      expect(workOrder.status).toBe(WorkOrderStatus.DELIVERED)
      expect(workOrder.history.map((change) => change.status)).toEqual([
        WorkOrderStatus.RECEIVED,
        WorkOrderStatus.IN_DIAGNOSIS,
        WorkOrderStatus.AWAITING_APPROVAL,
        WorkOrderStatus.IN_EXECUTION,
        WorkOrderStatus.FINISHED,
        WorkOrderStatus.DELIVERED,
      ])
    })

    it('touches updatedAt on transition', () => {
      const workOrder = openWorkOrder()
      const before = workOrder.updatedAt.getTime()

      workOrder.startDiagnosis()

      expect(workOrder.updatedAt.getTime()).toBeGreaterThanOrEqual(before)
      expect(workOrder.history).toHaveLength(2)
    })

    it('rejects an invalid transition and keeps state untouched', () => {
      const workOrder = openWorkOrder()

      expect(() => workOrder.startExecution()).toThrow(InvalidWorkOrderTransitionError)
      expect(workOrder.status).toBe(WorkOrderStatus.RECEIVED)
      expect(workOrder.history).toHaveLength(1)
    })

    it('cancels from a non-terminal status but not after delivery', () => {
      const workOrder = openWorkOrder()
      workOrder.startDiagnosis()
      workOrder.cancel()

      expect(workOrder.status).toBe(WorkOrderStatus.CANCELLED)
      expect(() => workOrder.startExecution()).toThrow(InvalidWorkOrderTransitionError)
    })
  })
})
