import { Injectable } from '@nestjs/common'
import type { SagaInstance as SagaInstanceRow } from '../../../generated/prisma/client'
import { PrismaService } from '../../../shared/database/prisma.service'
import { SagaInstance, SagaStatus, SagaStep } from '../domain/saga-instance.entity'
import { SagaInstanceRepository } from '../application/ports/saga-instance.repository'

@Injectable()
export class PrismaSagaInstanceRepository implements SagaInstanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(saga: SagaInstance): Promise<void> {
    await this.prisma.sagaInstance.create({ data: this.toRow(saga) })
  }

  async update(saga: SagaInstance): Promise<void> {
    const { workOrderId, ...data } = this.toRow(saga)
    await this.prisma.sagaInstance.update({ where: { workOrderId }, data })
  }

  async findByWorkOrderId(workOrderId: string): Promise<SagaInstance | null> {
    const row = await this.prisma.sagaInstance.findUnique({ where: { workOrderId } })
    return row ? this.toEntity(row) : null
  }

  private toRow(saga: SagaInstance): SagaInstanceRow {
    return {
      workOrderId: saga.workOrderId,
      status: saga.status,
      step: saga.step,
      partsReserved: saga.partsReserved,
      quoteGenerated: saga.quoteGenerated,
      paymentConfirmed: saga.paymentConfirmed,
      createdAt: saga.createdAt,
      updatedAt: saga.updatedAt,
    }
  }

  private toEntity(row: SagaInstanceRow): SagaInstance {
    return SagaInstance.restore({
      workOrderId: row.workOrderId,
      status: row.status as SagaStatus,
      step: row.step as SagaStep,
      partsReserved: row.partsReserved,
      quoteGenerated: row.quoteGenerated,
      paymentConfirmed: row.paymentConfirmed,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })
  }
}
