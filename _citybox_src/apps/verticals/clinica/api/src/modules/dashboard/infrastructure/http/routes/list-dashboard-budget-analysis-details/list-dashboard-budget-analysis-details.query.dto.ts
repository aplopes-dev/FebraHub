import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  DashboardBudgetAnalysisDimension,
  DashboardBudgetPeriodMode,
  DashboardBudgetUiStatus,
} from '../../../../application/utils/dashboard-budget-analysis.types';

const PERIOD_MODES: DashboardBudgetPeriodMode[] = ['annual', 'monthly'];
const STATUSES: DashboardBudgetUiStatus[] = ['open', 'approved', 'rejected'];
const DIMENSIONS: DashboardBudgetAnalysisDimension[] = [
  'professionals',
  'plans',
  'treatments',
];

export class ListDashboardBudgetAnalysisDetailsQueryDto {
  @ApiProperty({ enum: STATUSES })
  @IsIn(STATUSES)
  status!: DashboardBudgetUiStatus;

  @ApiProperty({ enum: PERIOD_MODES })
  @IsIn(PERIOD_MODES)
  periodMode!: DashboardBudgetPeriodMode;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  @ApiPropertyOptional()
  @ValidateIf(
    (o: ListDashboardBudgetAnalysisDetailsQueryDto) =>
      o.periodMode === 'monthly',
  )
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  professionalId?: string;

  @ApiPropertyOptional({ enum: DIMENSIONS })
  @IsOptional()
  @IsIn(DIMENSIONS)
  dimension?: DashboardBudgetAnalysisDimension;

  @ApiPropertyOptional({
    description: 'Chave da dimensão; omitido = listagem do Status por status',
  })
  @IsOptional()
  @IsString()
  dimensionKey?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage?: number;

  @ApiPropertyOptional({ description: 'Busca por nome do paciente' })
  @IsOptional()
  @IsString()
  search?: string;
}
