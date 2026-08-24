import { Type } from 'class-transformer';
import { IsIn, IsInt, Max, Min, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { DashboardInadimplenciaPeriodMode } from '../../../../application/utils/dashboard-inadimplencia.types';

const PERIOD_MODES: DashboardInadimplenciaPeriodMode[] = ['annual', 'monthly'];

export class GetDashboardInadimplenciaQueryDto {
  @ApiProperty({ enum: PERIOD_MODES })
  @IsIn(PERIOD_MODES)
  periodMode!: DashboardInadimplenciaPeriodMode;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  @ApiPropertyOptional({ description: 'Obrigatório quando periodMode=monthly' })
  @ValidateIf(
    (o: GetDashboardInadimplenciaQueryDto) => o.periodMode === 'monthly',
  )
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;
}
