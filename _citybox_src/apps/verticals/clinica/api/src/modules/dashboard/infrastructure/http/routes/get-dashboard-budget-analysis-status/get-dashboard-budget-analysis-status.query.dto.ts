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
  DashboardBudgetPeriodMode,
} from '../../../../application/utils/dashboard-budget-analysis.types';

const PERIOD_MODES: DashboardBudgetPeriodMode[] = ['annual', 'monthly'];

export class GetDashboardBudgetAnalysisStatusQueryDto {
  @ApiProperty({ enum: PERIOD_MODES })
  @IsIn(PERIOD_MODES)
  periodMode!: DashboardBudgetPeriodMode;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  @ApiPropertyOptional({ description: 'Obrigatório quando periodMode=monthly' })
  @ValidateIf((o: GetDashboardBudgetAnalysisStatusQueryDto) => o.periodMode === 'monthly')
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiPropertyOptional({
    description: 'Filtro pelo responsável do orçamento (responsibleId)',
  })
  @IsOptional()
  @IsString()
  professionalId?: string;
}
