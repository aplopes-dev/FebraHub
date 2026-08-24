import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PERSON_TYPES } from '../../../../../../shared/core/utils/document';
import { ORGANIZATION_STATUSES } from '../../../../domain/entities/organization.entity';

export class CreateOrganizationHttpDto {
  @ApiProperty({ enum: PERSON_TYPES, example: 'PJ' })
  @IsEnum(PERSON_TYPES)
  personType!: (typeof PERSON_TYPES)[number];

  @ApiProperty({
    description: 'CNPJ (PJ) ou CPF (PF). Aceita máscara — é normalizado.',
    example: '11.222.333/0001-81',
  })
  @IsString()
  @MaxLength(20)
  document!: string;

  @ApiProperty({ description: 'Razão social (PJ) ou nome completo (PF)' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  legalName!: string;

  @ApiPropertyOptional({ description: 'Nome fantasia' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  tradeName?: string;

  @ApiProperty({ example: 'contato@empresa.com.br' })
  @IsEmail()
  @MaxLength(200)
  email!: string;

  @ApiPropertyOptional({ example: '73999998888' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({ description: 'Responsável legal pela organização' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  responsibleName!: string;

  @ApiPropertyOptional({
    description: 'CPF do responsável',
    example: '529.982.247-25',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  responsibleDocument?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  responsibleEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  responsiblePhone?: string;
}

/**
 * Documento e tipo de pessoa não aparecem aqui: trocá-los transformaria a
 * organização em outra empresa, com o histórico fiscal pendurado.
 */
export class UpdateOrganizationHttpDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  legalName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  tradeName?: string;

  @ApiProperty()
  @IsEmail()
  @MaxLength(200)
  email!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  responsibleName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  responsibleDocument?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  responsibleEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  responsiblePhone?: string;

  @ApiPropertyOptional({ enum: ORGANIZATION_STATUSES })
  @IsOptional()
  @IsEnum(ORGANIZATION_STATUSES)
  status?: (typeof ORGANIZATION_STATUSES)[number];
}
