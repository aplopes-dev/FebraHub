import { Type } from 'class-transformer';
import { IsIn, IsInt, Max, Min, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { DashboardExpenseByCategoryPeriodMode } from '../../../../application/utils/dashboard-expense-by-category.types';

const PERIOD_MODES: DashboardExpenseByCategoryPeriodMode[] = [
  'annual',
  'monthly',
];

export class GetDashboardExpenseByCategoryQueryDto {
  @ApiProperty({ enum: PERIOD_MODES })
  @IsIn(PERIOD_MODES)
  periodMode!: DashboardExpenseByCategoryPeriodMode;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  @ApiPropertyOptional({ description: 'Obrigatório quando periodMode=monthly' })
  @ValidateIf(
    (o: GetDashboardExpenseByCategoryQueryDto) => o.periodMode === 'monthly',
  )
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;
}
