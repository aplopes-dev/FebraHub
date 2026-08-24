import { Type } from 'class-transformer';
import { IsIn, IsInt, Max, Min, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { DashboardCommissionsPeriodMode } from '../../../../application/utils/dashboard-commissions.types';

const PERIOD_MODES: DashboardCommissionsPeriodMode[] = ['annual', 'monthly'];

export class GetDashboardCommissionsQueryDto {
  @ApiProperty({ enum: PERIOD_MODES })
  @IsIn(PERIOD_MODES)
  periodMode!: DashboardCommissionsPeriodMode;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  @ApiPropertyOptional({ description: 'Obrigatório quando periodMode=monthly' })
  @ValidateIf(
    (o: GetDashboardCommissionsQueryDto) => o.periodMode === 'monthly',
  )
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;
}
