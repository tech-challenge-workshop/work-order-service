import { HealthController } from '../../../src/shared/health/health.controller'

describe('HealthController', () => {
  it('returns ok status', () => {
    const controller = new HealthController()

    expect(controller.check()).toEqual({ status: 'ok', service: 'work-order-service' })
  })
})
