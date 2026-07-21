import { PartialType } from '@nestjs/swagger'
import { CreateRepairServiceDto } from './create-repair-service.dto'

export class UpdateRepairServiceDto extends PartialType(CreateRepairServiceDto) {}
