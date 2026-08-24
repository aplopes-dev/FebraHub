import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

const STATUSES = [
  'pending',
  'signed',
  'refused',
  'cancelled',
  'expired',
] as const;

export class ListPatientSignaturesQueryDto {
  @ApiPropertyOptional({
    enum: STATUSES,
    default: 'pending',
    description: 'Status da assinatura. Default: pending.',
  })
  @IsOptional()
  @IsIn(STATUSES)
  status?: (typeof STATUSES)[number];

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
