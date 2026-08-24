import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Transform, Type, type TransformFnParams } from 'class-transformer';
import { MAX_PER_PAGE } from '../../../../../../tenancy/application/pagination';
import {
  FINANCIAL_ENTRY_OPERATIONS,
  FINANCIAL_ENTRY_STATUSES,
  type FinancialEntryOperation,
  type FinancialEntryStatus,
} from '../../../../domain/entities/financial-entry.entity';
import {
  FINANCIAL_ENTRY_LIST_TABS,
  FINANCIAL_ENTRY_SORT_OPTIONS,
  type FinancialEntryListTab,
  type FinancialEntrySortOption,
} from '../../../../domain/repositories/financial-entry.repository.interface';

/** Normaliza `?status=a&status=b` (array) e `?status=a` (valor único) para array. */
function toArray({ value }: TransformFnParams): unknown[] {
  return Array.isArray(value) ? value : [value];
}

export class FinancialEntryPaymentHttpDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ example: 500000 })
  @IsInt()
  @Min(1)
  amountCents!: number;

  @ApiProperty({ example: '2026-08-01' })
  @IsDateString()
  paidAt!: string;

  @ApiProperty({
    description: 'PaymentMethod.id (UUID) — spec 007-financeiro-ajustes-ui',
  })
  @IsUUID()
  paymentMethod!: string;

  @ApiPropertyOptional({ maxLength: 60 })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  cardBrand?: string;
}

export class FinancialEntryAllocationHttpDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty()
  @IsUUID()
  chartOfAccountId!: string;

  @ApiProperty({
    description: 'Obrigatório em toda linha de rateio (FR-010).',
  })
  @IsUUID()
  costCenterId!: string;

  @ApiProperty({ example: 800000 })
  @IsInt()
  @Min(1)
  amountCents!: number;

  @ApiProperty({ example: 80 })
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage!: number;
}

export class FinancialEntryWritableHttpDto {
  @ApiProperty({ enum: FINANCIAL_ENTRY_OPERATIONS })
  @IsIn(FINANCIAL_ENTRY_OPERATIONS)
  operation!: FinancialEntryOperation;

  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @ApiProperty({ example: 10000 })
  @IsInt()
  @Min(0)
  amountCents!: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  feesCents?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  finesCents?: number;

  @ApiProperty({ example: '2026-08-01' })
  @IsDateString()
  competenceDate!: string;

  @ApiProperty({ example: '2026-08-10' })
  @IsDateString()
  dueDate!: string;

  @ApiPropertyOptional({ maxLength: 160 })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  partyName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  bankAccountId?: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  categoryName?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @ApiPropertyOptional({ type: [FinancialEntryPaymentHttpDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FinancialEntryPaymentHttpDto)
  payments?: FinancialEntryPaymentHttpDto[];

  @ApiProperty({
    type: [FinancialEntryAllocationHttpDto],
    description:
      'Obrigatório fechar 100% do valor total (tolerância de 1 centavo) quando o total é maior que zero.',
  })
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => FinancialEntryAllocationHttpDto)
  allocations!: FinancialEntryAllocationHttpDto[];
}

/**
 * Filtros comuns à listagem (`ListFinancialEntriesQueryDto`) e ao resumo do
 * extrato (`GetFinancialEntriesSummaryQueryDto`) — extraído para não repetir
 * os mesmos decorators de validação em dois DTOs (`research.md` D5 de
 * `004-financial-statement`).
 */
export class FinancialEntryFilterQueryDto {
  @ApiPropertyOptional({ enum: FINANCIAL_ENTRY_OPERATIONS })
  @IsOptional()
  @IsIn(FINANCIAL_ENTRY_OPERATIONS)
  operation?: FinancialEntryOperation;

  @ApiPropertyOptional({ enum: FINANCIAL_ENTRY_STATUSES, isArray: true })
  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsIn(FINANCIAL_ENTRY_STATUSES, { each: true })
  status?: FinancialEntryStatus[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsUUID(4, { each: true })
  chartOfAccountId?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsUUID(4, { each: true })
  costCenterId?: string[];

  @ApiPropertyOptional({
    description: 'Lançamento vinculado a essa conta bancária',
  })
  @IsOptional()
  @IsUUID(4)
  bankAccountId?: string;

  @ApiPropertyOptional({ description: 'Busca por descrição ou parte' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  search?: string;

  @ApiPropertyOptional({ example: '2026-08-01', description: 'Vencimento de' })
  @IsOptional()
  @IsDateString()
  dueFrom?: string;

  @ApiPropertyOptional({ example: '2026-08-31', description: 'Vencimento até' })
  @IsOptional()
  @IsDateString()
  dueTo?: string;

  @ApiPropertyOptional({ example: '2026-08-01', description: 'Competência de' })
  @IsOptional()
  @IsDateString()
  competenceFrom?: string;

  @ApiPropertyOptional({
    example: '2026-08-31',
    description: 'Competência até',
  })
  @IsOptional()
  @IsDateString()
  competenceTo?: string;
}

export class ListFinancialEntriesQueryDto extends FinancialEntryFilterQueryDto {
  @ApiPropertyOptional({ enum: FINANCIAL_ENTRY_LIST_TABS, default: 'active' })
  @IsOptional()
  @IsIn(FINANCIAL_ENTRY_LIST_TABS)
  tab?: FinancialEntryListTab;

  @ApiPropertyOptional({ enum: FINANCIAL_ENTRY_SORT_OPTIONS })
  @IsOptional()
  @IsIn(FINANCIAL_ENTRY_SORT_OPTIONS)
  sort?: FinancialEntrySortOption;

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
