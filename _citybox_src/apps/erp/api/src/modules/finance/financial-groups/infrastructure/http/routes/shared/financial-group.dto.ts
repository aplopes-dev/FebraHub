import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MAX_PER_PAGE } from '../../../../../../tenancy/application/pagination';
import {
  FINANCIAL_GROUP_TYPES,
  type FinancialGroupType,
} from '../../../../domain/entities/financial-group.entity';
import { FINANCIAL_GROUP_LIST_TABS } from '../../../../domain/repositories/financial-group.repository.interface';

export class CreateFinancialGroupHttpDto {
  @ApiProperty({ example: 'Vendas' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ enum: FINANCIAL_GROUP_TYPES, example: 'receita' })
  @IsIn(FINANCIAL_GROUP_TYPES)
  type!: FinancialGroupType;
}

/** Semântica de PUT: nome e tipo são obrigatórios, não parciais. */
export class UpdateFinancialGroupHttpDto {
  @ApiProperty({ example: 'Vendas' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ enum: FINANCIAL_GROUP_TYPES, example: 'receita' })
  @IsIn(FINANCIAL_GROUP_TYPES)
  type!: FinancialGroupType;
}

export class ListFinancialGroupsQueryDto {
  @ApiPropertyOptional({ enum: FINANCIAL_GROUP_LIST_TABS, default: 'active' })
  @IsOptional()
  @IsEnum(FINANCIAL_GROUP_LIST_TABS)
  tab?: (typeof FINANCIAL_GROUP_LIST_TABS)[number];

  @ApiPropertyOptional({ description: 'Busca por nome' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({ enum: FINANCIAL_GROUP_TYPES })
  @IsOptional()
  @IsIn(FINANCIAL_GROUP_TYPES)
  type?: FinancialGroupType;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, maximum: MAX_PER_PAGE })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PER_PAGE)
  perPage?: number;
}
