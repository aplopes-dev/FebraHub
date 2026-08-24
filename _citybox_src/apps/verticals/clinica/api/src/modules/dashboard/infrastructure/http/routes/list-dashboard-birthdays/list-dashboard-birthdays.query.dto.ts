import { Type } from 'class-transformer';
import {
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

const BIRTHDAY_PERIODS: BirthdayPeriod[] = [
  'today',
  'this_week',
  'this_month',
  'next_30_days',
  'last_30_days',
  'custom',
];

export class ListDashboardBirthdaysQueryDto {
  @ApiPropertyOptional({ enum: BIRTHDAY_PERIODS, default: 'next_30_days' })
  @IsOptional()
  @IsIn(BIRTHDAY_PERIODS)
  period?: BirthdayPeriod;

  @ApiPropertyOptional({ description: 'ISO yyyy-MM-dd (obrigatório se period=custom)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'ISO yyyy-MM-dd (obrigatório se period=custom)' })
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
