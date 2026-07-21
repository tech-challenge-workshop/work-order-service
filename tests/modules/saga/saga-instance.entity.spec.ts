import {
  SagaInstance,
  SagaStatus,
  SagaStep,
} from '../../../src/modules/saga/domain/saga-instance.entity'

describe('SagaInstance', () => {
  it('starts running at the parts reservation step', () => {
    const saga = SagaInstance.start('work-order-1')

    expect(saga.status).toBe(SagaStatus.RUNNING)
    expect(saga.step).toBe(SagaStep.RESERVING_PARTS)
    expect(saga.partsReserved).toBe(false)
    expect(saga.quoteGenerated).toBe(false)
    expect(saga.paymentConfirmed).toBe(false)
    expect(saga.isRunning).toBe(true)
  })

  it('records progress flags as milestones are reached', () => {
    const saga = SagaInstance.start('work-order-1')

    saga.markPartsReserved()
    expect(saga.partsReserved).toBe(true)
    expect(saga.step).toBe(SagaStep.GENERATING_QUOTE)

    saga.markQuoteGenerated()
    expect(saga.quoteGenerated).toBe(true)
    expect(saga.step).toBe(SagaStep.AWAITING_APPROVAL)

    saga.markPaymentConfirmed()
    expect(saga.paymentConfirmed).toBe(true)
    expect(saga.step).toBe(SagaStep.EXECUTING)
  })

  it('completes into a terminal, non-running state', () => {
    const saga = SagaInstance.start('work-order-1')

    saga.complete()

    expect(saga.status).toBe(SagaStatus.COMPLETED)
    expect(saga.step).toBe(SagaStep.COMPLETED)
    expect(saga.isRunning).toBe(false)
  })

  it('cancels into a terminal, non-running state', () => {
    const saga = SagaInstance.start('work-order-1')

    saga.cancel()

    expect(saga.status).toBe(SagaStatus.CANCELLED)
    expect(saga.step).toBe(SagaStep.COMPENSATED)
    expect(saga.isRunning).toBe(false)
  })
})
