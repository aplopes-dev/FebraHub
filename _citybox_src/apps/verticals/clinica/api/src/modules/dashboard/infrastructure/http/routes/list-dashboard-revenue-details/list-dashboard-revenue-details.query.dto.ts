import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class ListDashboardRevenueDetailsQueryDto {
  @ApiPropertyOptional({ enum: MODES, default: 'receipts' })
  @IsOptional()
  @IsIn(MODES)
  mode?: DashboardRevenueMode;

  @ApiPropertyOptional({ enum: DIMENSIONS, default: 'professionals' })
  @IsOptional()
  @IsIn(DIMENSIONS)
  dimension?: DashboardRevenueDimension;

  @ApiProperty({ description: 'Chave da dimensão (ex.: professionalId)' })
  @IsString()
  @MinLength(1)
  dimensionKey!: string;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
