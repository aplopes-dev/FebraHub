import {
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BILLING_STATUSES } from '../../../../domain/entities/store-settings.entity';

export class PutStoreBillingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  planName?: string;

  @ApiPropertyOptional({ enum: BILLING_STATUSES })
  @IsOptional()
  @IsIn(BILLING_STATUSES)
  status?: string;

  @ApiPropertyOptional({ description: 'ISO 8601; `null` limpa a data' })
  @IsOptional()
  @ValidateIf((dto: PutStoreBillingDto) => dto.renewsAt !== null)
  @IsISO8601()
  renewsAt?: string | null;

  @ApiPropertyOptional({ description: 'Valor em centavos' })
  @IsOptional()
  @IsInt()
  @Min(0)
  amountCents?: number;
}
