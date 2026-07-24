import { Logger } from '@nestjs/common'
import { LoggerNotificationAdapter } from '../../../src/shared/notifications/logger-notification.adapter'
import { WorkOrderStatus } from '../../../src/modules/work-orders/domain/value-objects/work-order-status'

describe('LoggerNotificationAdapter', () => {
  it('logs a structured status change entry', async () => {
    const adapter = new LoggerNotificationAdapter()
    const spy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined)

    await adapter.notifyStatusChange({
      workOrderId: 'wo-1',
      customerId: 'c-1',
      previousStatus: WorkOrderStatus.RECEIVED,
      newStatus: WorkOrderStatus.IN_DIAGNOSIS,
      occurredAt: new Date('2026-07-22T10:00:00Z'),
    })

    expect(spy).toHaveBeenCalledTimes(1)
    const payload = JSON.parse(spy.mock.calls[0][0] as string) as Record<string, unknown>
    expect(payload).toMatchObject({
      event: 'work_order.status_changed',
      workOrderId: 'wo-1',
      customerId: 'c-1',
      previousStatus: WorkOrderStatus.RECEIVED,
      newStatus: WorkOrderStatus.IN_DIAGNOSIS,
      occurredAt: '2026-07-22T10:00:00.000Z',
    })

    spy.mockRestore()
  })
})
