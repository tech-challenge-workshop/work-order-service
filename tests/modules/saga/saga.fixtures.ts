import { SagaInstance } from '../../../src/modules/saga/domain/saga-instance.entity'
import type { SagaInstanceRepository } from '../../../src/modules/saga/application/ports/saga-instance.repository'

export class FakeSagaInstanceRepository implements SagaInstanceRepository {
  sagas = new Map<string, SagaInstance>()

  create(saga: SagaInstance): Promise<void> {
    this.sagas.set(saga.workOrderId, saga)
    return Promise.resolve()
  }

  update(saga: SagaInstance): Promise<void> {
    this.sagas.set(saga.workOrderId, saga)
    return Promise.resolve()
  }

  findByWorkOrderId(workOrderId: string): Promise<SagaInstance | null> {
    return Promise.resolve(this.sagas.get(workOrderId) ?? null)
  }
}
