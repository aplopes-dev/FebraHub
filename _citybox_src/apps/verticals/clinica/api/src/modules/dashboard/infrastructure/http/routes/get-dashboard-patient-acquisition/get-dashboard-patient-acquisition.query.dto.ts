import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { DashboardAcquisitionPeriodMode } from '../../../../application/utils/dashboard-patient-acquisition.types';

const PERIOD_MODES: DashboardAcquisitionPeriodMode[] = ['annual', 'monthly'];

export class GetDashboardPatientAcquisitionQueryDto {
  @ApiProperty({ enum: PERIOD_MODES })
  @IsIn(PERIOD_MODES)
  periodMode!: DashboardAcquisitionPeriodMode;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  @ApiPropertyOptional({ description: 'Obrigatório quando periodMode=monthly' })
  @ValidateIf(
    (o: GetDashboardPatientAcquisitionQueryDto) => o.periodMode === 'monthly',
  )
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;
}
