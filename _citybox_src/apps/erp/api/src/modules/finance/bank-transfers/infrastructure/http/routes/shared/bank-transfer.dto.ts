import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';

const MAX_DESCRIPTION_LENGTH = 240;

/**
 * `paymentMethod` é `PaymentMethod.id` (UUID) desde
 * `007-financeiro-ajustes-ui` US3 — antes reaproveitava o enum fixo de
 * `FinancialEntryPayment` (research.md D4 de 002-bank-account-ledger).
 */
export class CreateBankTransferHttpDto {
  @ApiProperty()
  @IsUUID()
  fromBankAccountId!: string;

  @ApiProperty()
  @IsUUID()
  toBankAccountId!: string;

  @ApiProperty({ example: 10000, description: 'Valor em centavos' })
  @IsInt()
  @Min(1)
  amountCents!: number;

  @ApiProperty({ example: '2026-08-05' })
  @IsDateString()
  effectiveAt!: string;

  @ApiProperty({
    description: 'PaymentMethod.id (UUID) — spec 007-financeiro-ajustes-ui',
  })
  @IsUUID()
  paymentMethod!: string;

  @ApiProperty()
  @IsUUID()
  costCenterId!: string;

  @ApiPropertyOptional({ maxLength: MAX_DESCRIPTION_LENGTH })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_DESCRIPTION_LENGTH)
  description?: string;
}
