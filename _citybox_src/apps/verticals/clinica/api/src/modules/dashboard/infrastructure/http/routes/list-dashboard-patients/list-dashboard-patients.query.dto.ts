import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  DASHBOARD_PATIENT_METRIC_IDS,
  type DashboardPatientMetricId,
} from '../../../../application/utils/dashboard-patients.types';

export class ListDashboardPatientsQueryDto {
  @ApiProperty({ enum: DASHBOARD_PATIENT_METRIC_IDS })
  @IsIn(DASHBOARD_PATIENT_METRIC_IDS)
  metric!: DashboardPatientMetricId;

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

  @ApiPropertyOptional({ description: 'Busca por nome, e-mail ou CPF' })
  @IsOptional()
  @IsString()
  search?: string;
}
