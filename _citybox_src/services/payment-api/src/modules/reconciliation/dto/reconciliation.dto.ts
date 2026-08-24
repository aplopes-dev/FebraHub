import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class ReconciliationImportRowDto {
  @IsOptional()
  @IsString()
  externalReference?: string;

  @IsOptional()
  @IsString()
  providerReference?: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsString()
  transactionDate?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class ImportReconciliationDto {
  @IsOptional()
  @IsString()
  provider?: string;

  @IsEnum(['BANK_STATEMENT', 'PROVIDER_EXTRACT', 'MANUAL'])
  source!: 'BANK_STATEMENT' | 'PROVIDER_EXTRACT' | 'MANUAL';

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsString()
  csvContent?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReconciliationImportRowDto)
  rows?: ReconciliationImportRowDto[];
}

export class MatchReconciliationDto {
  @IsOptional()
  @IsString()
  chargeId?: string;

  @IsOptional()
  @IsString()
  paymentId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class MarkDivergentDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
