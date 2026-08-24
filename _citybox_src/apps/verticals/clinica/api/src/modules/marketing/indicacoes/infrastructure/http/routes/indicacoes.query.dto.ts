import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  IndicacoesPeriodMode,
  IndicacoesReferrerKind,
} from '../../../domain/indicacoes.types';

const PERIOD_MODES: IndicacoesPeriodMode[] = ['annual', 'monthly'];
const REFERRER_KINDS: IndicacoesReferrerKind[] = [
  'patient',
  'team',
  'external',
];

export class IndicacoesPeriodQueryDto {
  @ApiProperty({ enum: PERIOD_MODES })
  @IsIn(PERIOD_MODES)
  periodMode!: IndicacoesPeriodMode;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  @ApiPropertyOptional({ description: 'Obrigatório quando periodMode=monthly' })
  @ValidateIf((o: IndicacoesPeriodQueryDto) => o.periodMode === 'monthly')
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;
}

export class ListIndicacoesReferredPatientsQueryDto extends IndicacoesPeriodQueryDto {
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

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({
    enum: REFERRER_KINDS,
    description: 'Filtra pelo indicador; exige referrerId',
  })
  @ValidateIf(
    (o: ListIndicacoesReferredPatientsQueryDto) =>
      o.referrerId != null && o.referrerId !== '',
  )
  @IsIn(REFERRER_KINDS)
  referrerKind?: IndicacoesReferrerKind;

  @ApiPropertyOptional({
    description: 'Filtra pelo indicador; exige referrerKind',
  })
  @ValidateIf(
    (o: ListIndicacoesReferredPatientsQueryDto) => o.referrerKind != null,
  )
  @IsUUID()
  referrerId?: string;
}

export class ListIndicacoesReferrersQueryDto extends IndicacoesPeriodQueryDto {
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
    enum: ['totalReferrals', 'approvedBudgetsCount'],
    default: 'totalReferrals',
  })
  @IsOptional()
  @IsIn(['totalReferrals', 'approvedBudgetsCount'])
  sortBy?: 'totalReferrals' | 'approvedBudgetsCount';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
