import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PutAgentProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(180)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  role?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(180)
  @ValidateIf((dto: PutAgentProfileDto) => Boolean(dto.email?.trim()))
  @IsEmail({}, { message: 'email deve ser um e-mail válido' })
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(180)
  region?: string;

  @ApiPropertyOptional({ description: 'CRECI' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  stateId?: string;

  @ApiPropertyOptional({ description: 'CPF/CNPJ' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  taxId?: string;
}
