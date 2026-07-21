import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator'

export class CreateRepairServiceDto {
  @ApiProperty({ example: 'Oil change' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string

  @ApiPropertyOptional({ example: 'Includes synthetic oil and filter replacement' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string

  @ApiProperty({ example: 15000, description: 'Price in cents (e.g. 15000 = R$ 150.00)' })
  @IsInt()
  @Min(0)
  priceCents!: number
}
