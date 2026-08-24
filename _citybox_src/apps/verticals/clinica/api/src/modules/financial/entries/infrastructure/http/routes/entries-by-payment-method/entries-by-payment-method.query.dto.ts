import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class EntriesByPaymentMethodQueryDto {
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

  @ApiPropertyOptional({ example: '2026-07-15' })
  @IsOptional()
  @IsDateString()
  paidAtFrom?: string;

  @ApiPropertyOptional({ example: '2026-07-31' })
  @IsOptional()
  @IsDateString()
  paidAtTo?: string;

  @ApiPropertyOptional({ description: 'CSV: income,expense' })
  @IsOptional()
  @IsString()
  types?: string;

  @ApiPropertyOptional({ description: 'CSV de accountIds' })
  @IsOptional()
  @IsString()
  accountIds?: string;

  @ApiPropertyOptional({ description: 'CSV de paymentMethods' })
  @IsOptional()
  @IsString()
  paymentMethods?: string;
}
