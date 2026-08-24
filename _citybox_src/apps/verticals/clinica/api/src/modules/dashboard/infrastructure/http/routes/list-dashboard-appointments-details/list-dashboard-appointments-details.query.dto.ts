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
import type {
  DashboardAppointmentGroup,
  DashboardAppointmentsPeriodMode,
} from '../../../../application/utils/dashboard-appointments.types';

const PERIOD_MODES: DashboardAppointmentsPeriodMode[] = ['annual', 'monthly'];
const GROUPS: DashboardAppointmentGroup[] = ['realized', 'missed_cancelled'];

export class ListDashboardAppointmentsDetailsQueryDto {
  @ApiProperty({ enum: GROUPS })
  @IsIn(GROUPS)
  group!: DashboardAppointmentGroup;

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
    (o: ListDashboardAppointmentsDetailsQueryDto) => o.periodMode === 'monthly',
  )
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

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
}
