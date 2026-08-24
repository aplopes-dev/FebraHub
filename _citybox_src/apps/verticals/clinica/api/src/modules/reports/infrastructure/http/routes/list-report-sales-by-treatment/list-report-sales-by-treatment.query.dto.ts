import { Type } from 'class-transformer';
import { IsInt, IsOptional, Matches, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export class ListReportSalesByTreatmentQueryDto {
  @ApiProperty({ example: '2026-07-01' })
  @Matches(DATE_ONLY, { message: 'startDate must be yyyy-MM-dd' })
  startDate!: string;

  @ApiProperty({ example: '2026-07-31' })
  @Matches(DATE_ONLY, { message: 'endDate must be yyyy-MM-dd' })
  endDate!: string;

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
