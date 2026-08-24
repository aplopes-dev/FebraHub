import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import type { BirthdayPeriod } from '../../../../../patients/domain/utils/birthday-window.utils';
import type {
  DashboardRevenueDimension,
  DashboardRevenueMode,
} from '../../../../application/utils/dashboard-revenue.types';

const PERIODS: BirthdayPeriod[] = [
  'today',
  'this_week',
  'this_month',
  'next_30_days',
  'last_30_days',
  'custom',
];

const MODES: DashboardRevenueMode[] = ['receipts', 'sales'];
const DIMENSIONS: DashboardRevenueDimension[] = [
  'professionals',
  'plans',
  'treatments',
  'specialties',
];

export class GetDashboardRevenueAnalysisQueryDto {
  @ApiPropertyOptional({ enum: MODES, default: 'receipts' })
  @IsOptional()
  @IsIn(MODES)
  mode?: DashboardRevenueMode;

  @ApiPropertyOptional({ enum: DIMENSIONS, default: 'professionals' })
  @IsOptional()
  @IsIn(DIMENSIONS)
  dimension?: DashboardRevenueDimension;

  @ApiPropertyOptional({ enum: PERIODS, default: 'today' })
  @IsOptional()
  @IsIn(PERIODS)
  period?: BirthdayPeriod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description:
      'Inclui procedimentos/especialidades com venda no período e zero recebimentos (só mode=receipts)',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeWithoutRevenue?: boolean;
}
