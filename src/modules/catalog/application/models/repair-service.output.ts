import { RepairService } from '../../domain/repair-service.entity'

export interface RepairServiceOutput {
  id: string
  name: string
  description: string | null
  priceCents: number
  createdAt: Date
  updatedAt: Date
}

export function toRepairServiceOutput(repairService: RepairService): RepairServiceOutput {
  return {
    id: repairService.id,
    name: repairService.name,
    description: repairService.description,
    priceCents: repairService.price.cents,
    createdAt: repairService.createdAt,
    updatedAt: repairService.updatedAt,
  }
}
