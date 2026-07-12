import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

export class CreateCustomerDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string

  @ApiProperty({ example: '390.533.447-05', description: 'CPF or CNPJ, masked or digits-only' })
  @IsString()
  @IsNotEmpty()
  document!: string

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string

  @ApiPropertyOptional({ example: '+55 11 99999-9999' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string
}
