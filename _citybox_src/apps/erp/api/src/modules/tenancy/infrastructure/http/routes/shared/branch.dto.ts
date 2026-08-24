import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PERSON_TYPES } from '../../../../../../shared/core/utils/document';
import { TAX_REGIMES } from '../../../../domain/entities/branch.entity';
import { MAX_PER_PAGE } from '../../../../application/pagination';

class BranchAddressHttpDto {
  @ApiPropertyOptional({ example: '45650-000' })
  @IsOptional()
  @IsString()
  @MaxLength(12)
  zipCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  street?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  complement?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  neighborhood?: string;

  @ApiPropertyOptional({ example: 'Ilhéus' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'BA' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  state?: string;
}

export class CreateBranchHttpDto extends BranchAddressHttpDto {
  @ApiProperty({
    description: 'Código da unidade na organização',
    example: '001',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  code!: string;

  @ApiProperty({ enum: PERSON_TYPES, example: 'PJ' })
  @IsEnum(PERSON_TYPES)
  personType!: (typeof PERSON_TYPES)[number];

  @ApiProperty({
    description: 'CNPJ/CPF da unidade',
    example: '11.444.777/0001-61',
  })
  @IsString()
  @MaxLength(20)
  document!: string;

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

  @ApiPropertyOptional({ description: 'Inscrição estadual' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  stateRegistration?: string;

  @ApiPropertyOptional({ description: 'Inscrição municipal' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  municipalRegistration?: string;

  @ApiPropertyOptional({ enum: TAX_REGIMES, default: 'SIMPLES_NACIONAL' })
  @IsOptional()
  @IsEnum(TAX_REGIMES)
  taxRegime?: (typeof TAX_REGIMES)[number];

  @ApiPropertyOptional({
    description: 'Matriz da organização. No máximo uma por organização.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isHeadquarters?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  email?: string;

  @ApiPropertyOptional({ default: 'America/Bahia' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  timezone?: string;
}

/** Código, documento e tipo de pessoa são a identidade fiscal — imutáveis. */
export class UpdateBranchHttpDto extends BranchAddressHttpDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  stateRegistration?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  municipalRegistration?: string;

  @ApiPropertyOptional({ enum: TAX_REGIMES })
  @IsOptional()
  @IsEnum(TAX_REGIMES)
  taxRegime?: (typeof TAX_REGIMES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isHeadquarters?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  timezone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class ListBranchesQueryDto {
  @ApiPropertyOptional({ description: 'Busca por código, nome ou documento' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({ description: 'Somente unidades ativas' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, maximum: MAX_PER_PAGE })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_PER_PAGE)
  perPage?: number;
}
