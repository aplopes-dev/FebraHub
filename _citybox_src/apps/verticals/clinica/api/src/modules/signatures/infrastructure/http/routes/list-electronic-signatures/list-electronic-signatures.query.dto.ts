import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const KINDS = ['anamnesis', 'contract', 'evolution_batch'] as const;
const STATUSES = ['pending', 'signed'] as const;

export class ListElectronicSignaturesQueryDto {
  @ApiProperty({ example: '2026-08-01' })
  @Matches(DATE_ONLY, { message: 'startDate must be yyyy-MM-dd' })
  startDate!: string;

  @ApiProperty({ example: '2026-08-31' })
  @Matches(DATE_ONLY, { message: 'endDate must be yyyy-MM-dd' })
  endDate!: string;

  @ApiPropertyOptional({ enum: KINDS })
  @IsOptional()
  @IsIn(KINDS)
  kind?: (typeof KINDS)[number];

  /** Filtra listagem: `pending` e/ou `signed`. Omitido → ambos. */
  @ApiPropertyOptional({ enum: STATUSES, isArray: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return Array.isArray(value) ? value : [value];
  })
  @IsIn(STATUSES, { each: true })
  status?: (typeof STATUSES)[number][];

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

