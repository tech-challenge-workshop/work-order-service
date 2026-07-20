import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator'

export class ListVehiclesQuery {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage: number = 20

  @ApiPropertyOptional({ description: 'Matches plate, brand or model' })
  @IsOptional()
  @IsString()
  search?: string

  @ApiPropertyOptional({ format: 'uuid', description: 'Filter by owner' })
  @IsOptional()
  @IsUUID()
  customerId?: string
}
