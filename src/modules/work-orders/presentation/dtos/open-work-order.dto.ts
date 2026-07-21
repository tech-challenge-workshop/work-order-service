import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsArray, IsInt, IsOptional, IsUUID, Min, ValidateNested } from 'class-validator'

export class OpenWorkOrderPartDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  partId!: string

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity!: number
}

export class OpenWorkOrderDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  customerId!: string

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  vehicleId!: string

  @ApiPropertyOptional({ type: [String], format: 'uuid', description: 'Repair service ids' })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  serviceIds: string[] = []

  @ApiPropertyOptional({ type: [OpenWorkOrderPartDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OpenWorkOrderPartDto)
  parts?: OpenWorkOrderPartDto[]
}
