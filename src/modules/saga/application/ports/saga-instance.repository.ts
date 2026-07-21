import { SagaInstance } from '../../domain/saga-instance.entity'

export const SAGA_INSTANCE_REPOSITORY = Symbol('SAGA_INSTANCE_REPOSITORY')

export interface SagaInstanceRepository {
  create(saga: SagaInstance): Promise<void>
  update(saga: SagaInstance): Promise<void>
  findByWorkOrderId(workOrderId: string): Promise<SagaInstance | null>
}
