import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
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
  COST_CENTER_LIST_TABS,
  type CostCenterListTab,
} from '../../../../domain/repositories/cost-center.repository.interface';

const MAX_NAME_LENGTH = 120;

export class CreateCostCenterHttpDto {
  @ApiProperty({ example: 'Administrativo' })
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_NAME_LENGTH)
  name!: string;
}

export class UpdateCostCenterHttpDto {
  @ApiProperty({ example: 'Administrativo' })
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_NAME_LENGTH)
  name!: string;
}

export class ListCostCentersQueryDto {
  @ApiPropertyOptional({ enum: COST_CENTER_LIST_TABS, default: 'active' })
  @IsOptional()
  @IsIn(COST_CENTER_LIST_TABS)
  tab?: CostCenterListTab;

  @ApiPropertyOptional({ description: 'Busca por nome' })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_NAME_LENGTH)
  search?: string;

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
