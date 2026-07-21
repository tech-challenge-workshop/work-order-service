import {
  WorkOrderStatus,
  canTransition,
  listingPriorityOf,
  TERMINAL_STATUSES,
} from '../../../../../src/modules/work-orders/domain/value-objects/work-order-status'

describe('work-order-status', () => {
  describe('canTransition', () => {
    it('allows the forward lifecycle path', () => {
      expect(canTransition(WorkOrderStatus.RECEIVED, WorkOrderStatus.IN_DIAGNOSIS)).toBe(true)
      expect(canTransition(WorkOrderStatus.IN_DIAGNOSIS, WorkOrderStatus.AWAITING_APPROVAL)).toBe(
        true,
      )
      expect(canTransition(WorkOrderStatus.AWAITING_APPROVAL, WorkOrderStatus.IN_EXECUTION)).toBe(
        true,
      )
      expect(canTransition(WorkOrderStatus.IN_EXECUTION, WorkOrderStatus.FINISHED)).toBe(true)
      expect(canTransition(WorkOrderStatus.FINISHED, WorkOrderStatus.DELIVERED)).toBe(true)
    })

    it('allows cancellation from any non-terminal status', () => {
      expect(canTransition(WorkOrderStatus.RECEIVED, WorkOrderStatus.CANCELLED)).toBe(true)
      expect(canTransition(WorkOrderStatus.IN_EXECUTION, WorkOrderStatus.CANCELLED)).toBe(true)
    })

    it('rejects skipping and backward transitions', () => {
      expect(canTransition(WorkOrderStatus.RECEIVED, WorkOrderStatus.IN_EXECUTION)).toBe(false)
      expect(canTransition(WorkOrderStatus.IN_EXECUTION, WorkOrderStatus.RECEIVED)).toBe(false)
      expect(canTransition(WorkOrderStatus.FINISHED, WorkOrderStatus.CANCELLED)).toBe(false)
    })

    it('rejects any transition out of terminal statuses', () => {
      expect(canTransition(WorkOrderStatus.DELIVERED, WorkOrderStatus.RECEIVED)).toBe(false)
      expect(canTransition(WorkOrderStatus.CANCELLED, WorkOrderStatus.IN_DIAGNOSIS)).toBe(false)
    })
  })

  describe('listingPriorityOf', () => {
    it('orders active statuses as IN_EXECUTION > AWAITING_APPROVAL > IN_DIAGNOSIS > RECEIVED', () => {
      expect(listingPriorityOf(WorkOrderStatus.IN_EXECUTION)).toBeLessThan(
        listingPriorityOf(WorkOrderStatus.AWAITING_APPROVAL),
      )
      expect(listingPriorityOf(WorkOrderStatus.AWAITING_APPROVAL)).toBeLessThan(
        listingPriorityOf(WorkOrderStatus.IN_DIAGNOSIS),
      )
      expect(listingPriorityOf(WorkOrderStatus.IN_DIAGNOSIS)).toBeLessThan(
        listingPriorityOf(WorkOrderStatus.RECEIVED),
      )
    })
  })

  describe('TERMINAL_STATUSES', () => {
    it('contains finished, delivered and cancelled', () => {
      expect(TERMINAL_STATUSES).toEqual([
        WorkOrderStatus.FINISHED,
        WorkOrderStatus.DELIVERED,
        WorkOrderStatus.CANCELLED,
      ])
    })
  })
})
