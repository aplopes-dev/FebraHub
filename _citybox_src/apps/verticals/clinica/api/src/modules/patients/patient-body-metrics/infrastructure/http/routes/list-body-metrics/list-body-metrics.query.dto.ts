import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import type { PatientBodyMetricListSortBy } from '../../../../domain/repositories/patient-body-metric.repository.interface';

const SORT_FIELDS: PatientBodyMetricListSortBy[] = ['measuredAt'];

export class ListPatientBodyMetricsQueryDto {
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

  @ApiPropertyOptional({ enum: SORT_FIELDS, default: 'measuredAt' })
  @IsOptional()
  @IsIn(SORT_FIELDS)
  sortBy?: PatientBodyMetricListSortBy;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
