import { randomUUID } from 'node:crypto'
import {
  WorkOrderItem,
  WorkOrderItemKind,
} from '../../../../../src/modules/work-orders/domain/value-objects/work-order-item'
import { InvalidWorkOrderError } from '../../../../../src/modules/work-orders/domain/errors/work-order.errors'

function itemProps(overrides = {}) {
  return {
    kind: WorkOrderItemKind.PART,
    referenceId: randomUUID(),
    description: 'Brake pad',
    unitPriceCents: 5000,
    quantity: 2,
    ...overrides,
  }
}

describe('WorkOrderItem', () => {
  it('computes the subtotal as unit price times quantity', () => {
    const item = WorkOrderItem.create(itemProps({ unitPriceCents: 5000, quantity: 2 }))

    expect(item.subtotalCents).toBe(10000)
  })

  it('rejects a negative or fractional unit price', () => {
    expect(() => WorkOrderItem.create(itemProps({ unitPriceCents: -1 }))).toThrow(
      InvalidWorkOrderError,
    )
    expect(() => WorkOrderItem.create(itemProps({ unitPriceCents: 10.5 }))).toThrow(
      InvalidWorkOrderError,
    )
  })

  it('rejects a quantity below one or fractional', () => {
    expect(() => WorkOrderItem.create(itemProps({ quantity: 0 }))).toThrow(InvalidWorkOrderError)
    expect(() => WorkOrderItem.create(itemProps({ quantity: 1.5 }))).toThrow(InvalidWorkOrderError)
  })
})
