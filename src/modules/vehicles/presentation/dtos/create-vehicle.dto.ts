import { ApiProperty } from '@nestjs/swagger'
import { IsInt, IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator'

export class CreateVehicleDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  customerId!: string

  @ApiProperty({ example: 'ABC1D23', description: 'Brazilian plate, old or Mercosul format' })
  @IsString()
  @IsNotEmpty()
  plate!: string

  @ApiProperty({ example: 'Toyota' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  brand!: string

  @ApiProperty({ example: 'Corolla' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  model!: string

  @ApiProperty({ example: 2024 })
  @IsInt()
  year!: number
}
