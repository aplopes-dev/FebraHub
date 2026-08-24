import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import type { PatientFinancialEntryListSortBy } from '../../../../domain/repositories/patient-financial-entry.repository.interface';

const SORT_FIELDS: PatientFinancialEntryListSortBy[] = [
  'date',
  'name',
  'valueCents',
  'status',
];

export class ListPatientFinancialEntriesQueryDto {
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

  @ApiPropertyOptional({ description: 'Busca parcial por nome do lançamento' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['pending', 'received'] })
  @IsOptional()
  @IsIn(['pending', 'received'])
  status?: 'pending' | 'received';

  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @IsString()
  periodFrom?: string;

  @ApiPropertyOptional({ example: '2026-07-31' })
  @IsOptional()
  @IsString()
  periodTo?: string;

  @ApiPropertyOptional({
    description: 'Filtra lançamentos gerados a partir de um item do orçamento',
  })
  @IsOptional()
  @IsUUID()
  budgetItemId?: string;

  @ApiPropertyOptional({ enum: SORT_FIELDS })
  @IsOptional()
  @IsIn(SORT_FIELDS)
  sortBy?: PatientFinancialEntryListSortBy;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
