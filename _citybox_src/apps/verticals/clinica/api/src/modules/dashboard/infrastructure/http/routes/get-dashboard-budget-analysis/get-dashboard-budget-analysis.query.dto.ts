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

export class GetDashboardBudgetAnalysisQueryDto {
  @ApiProperty({ enum: STATUSES })
  @IsIn(STATUSES)
  status!: DashboardBudgetUiStatus;

  @ApiProperty({ enum: DIMENSIONS })
  @IsIn(DIMENSIONS)
  dimension!: DashboardBudgetAnalysisDimension;

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
    (o: GetDashboardBudgetAnalysisQueryDto) => o.periodMode === 'monthly',
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
}
