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
  DashboardAcquisitionPeriodMode,
  DashboardReferralSourceKey,
} from '../../../../application/utils/dashboard-patient-acquisition.types';

const PERIOD_MODES: DashboardAcquisitionPeriodMode[] = ['annual', 'monthly'];
const SOURCES: DashboardReferralSourceKey[] = [
  'indicacao',
  'indicacao_profissional',
  'indicacao_profissional_externo',
  'google',
  'instagram',
  'facebook',
  'outro',
  'nao_informado',
];

export class ListDashboardPatientAcquisitionDetailsQueryDto {
  @ApiProperty({ enum: SOURCES })
  @IsIn(SOURCES)
  source!: DashboardReferralSourceKey;

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
    (o: ListDashboardPatientAcquisitionDetailsQueryDto) =>
      o.periodMode === 'monthly',
  )
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

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

  @ApiPropertyOptional({
    description: 'Busca por nome, telefone, e-mail ou CPF',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
