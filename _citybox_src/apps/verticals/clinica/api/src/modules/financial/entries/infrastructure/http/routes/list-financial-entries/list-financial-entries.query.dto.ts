import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

const SORT_FIELDS = ['dueDate', 'description', 'valueCents', 'status'] as const;

export class ListFinancialEntriesQueryDto {
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

  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-07-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    enum: ['dueDate', 'paidAt'],
    description: 'Campo usado por startDate/endDate (default: dueDate)',
  })
  @IsOptional()
  @IsIn(['dueDate', 'paidAt'])
  dateField?: 'dueDate' | 'paidAt';

  @ApiPropertyOptional({
    example: '2026-07-15',
    description: 'Filtro adicional: paidAt >= paidAtFrom',
  })
  @IsOptional()
  @IsDateString()
  paidAtFrom?: string;

  @ApiPropertyOptional({
    example: '2026-07-31',
    description: 'Filtro adicional: paidAt <= paidAtTo',
  })
  @IsOptional()
  @IsDateString()
  paidAtTo?: string;

  @ApiPropertyOptional({ description: 'CSV: income,expense' })
  @IsOptional()
  @IsString()
  types?: string;

  @ApiPropertyOptional({ description: 'CSV: pending,paid,received,cancelled' })
  @IsOptional()
  @IsString()
  statuses?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  hasReceipt?: boolean;

  @ApiPropertyOptional({ description: 'CSV de accountIds' })
  @IsOptional()
  @IsString()
  accountIds?: string;

  @ApiPropertyOptional({ description: 'CSV de paymentMethods' })
  @IsOptional()
  @IsString()
  paymentMethods?: string;

  @ApiPropertyOptional({ description: 'CSV de categoryIds' })
  @IsOptional()
  @IsString()
  categoryIds?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: SORT_FIELDS })
  @IsOptional()
  @IsIn(SORT_FIELDS)
  sortBy?: (typeof SORT_FIELDS)[number];

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
