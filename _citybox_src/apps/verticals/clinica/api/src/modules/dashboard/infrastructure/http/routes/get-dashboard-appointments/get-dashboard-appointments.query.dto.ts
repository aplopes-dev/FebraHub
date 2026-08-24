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
import type { DashboardAppointmentsPeriodMode } from '../../../../application/utils/dashboard-appointments.types';

const PERIOD_MODES: DashboardAppointmentsPeriodMode[] = ['annual', 'monthly'];

export class GetDashboardAppointmentsQueryDto {
  @ApiProperty({ enum: PERIOD_MODES })
  @IsIn(PERIOD_MODES)
  periodMode!: DashboardAppointmentsPeriodMode;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  @ApiPropertyOptional({ description: 'Obrigatório quando periodMode=monthly' })
  @ValidateIf(
    (o: GetDashboardAppointmentsQueryDto) => o.periodMode === 'monthly',
  )
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiPropertyOptional({
    description: '`all` (default) ou UUID da categoria de agendamento',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;
}
