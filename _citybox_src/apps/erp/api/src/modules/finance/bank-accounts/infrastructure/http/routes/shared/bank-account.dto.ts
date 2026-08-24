import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MAX_PER_PAGE } from '../../../../../../tenancy/application/pagination';
import {
  BANK_ACCOUNT_LIST_TABS,
  type BankAccountListTab,
} from '../../../../domain/repositories/bank-account.repository.interface';

const MAX_NAME_LENGTH = 160;

export class BankAccountWritableHttpDto {
  @ApiProperty({ example: 'Caixa operacional', maxLength: MAX_NAME_LENGTH })
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_NAME_LENGTH)
  name!: string;

  @ApiPropertyOptional({
    example: 'Banco do Brasil',
    maxLength: MAX_NAME_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_NAME_LENGTH)
  bankName?: string;

  @ApiPropertyOptional({
    example: 'bank-bb',
    description:
      'Identificador estável do catálogo de bancos do frontend — garante o round-trip do Select ao reabrir a conta.',
    maxLength: MAX_NAME_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_NAME_LENGTH)
  bankCode?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  openingBalanceCents?: number;

  @ApiProperty({ example: '2026-01-01' })
  @IsDateString()
  openedAt!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  branchIds?: string[];
}

export class ListBankAccountsQueryDto {
  @ApiPropertyOptional({ enum: BANK_ACCOUNT_LIST_TABS, default: 'active' })
  @IsOptional()
  @IsIn(BANK_ACCOUNT_LIST_TABS)
  tab?: BankAccountListTab;

  @ApiPropertyOptional({ description: 'Busca por apelido da conta ou banco' })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_NAME_LENGTH)
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, maximum: MAX_PER_PAGE })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PER_PAGE)
  perPage?: number;
}
