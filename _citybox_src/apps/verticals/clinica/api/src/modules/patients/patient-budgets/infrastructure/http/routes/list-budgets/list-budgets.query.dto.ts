import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import type { BudgetListSortBy } from '../../../../domain/repositories/budget.repository.interface';

const SORT_FIELDS: BudgetListSortBy[] = [
  'date',
  'description',
  'finalValueCents',
  'status',
];

export class ListBudgetsQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage?: number;

  @ApiPropertyOptional({
    description: 'Busca por descrição ou responsável do orçamento',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: SORT_FIELDS })
  @IsOptional()
  @IsIn(SORT_FIELDS)
  sortBy?: BudgetListSortBy;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
