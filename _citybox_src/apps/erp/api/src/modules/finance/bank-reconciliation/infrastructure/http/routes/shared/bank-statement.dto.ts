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
  Min,
} from 'class-validator';
import { Transform, Type, type TransformFnParams } from 'class-transformer';
import { MAX_PER_PAGE } from '../../../../../../tenancy/application/pagination';
import { BANK_STATEMENT_STATUSES } from '../../../../domain/entities/bank-statement.entity';
import { ELIGIBLE_ENTRY_PERIOD_TYPES } from '../../../../application/dtos/search-eligible-entries.dto';

/** Normaliza `?periodType=a&periodType=b` (array) e `?periodType=a` (valor único) para array. */
function toArray({ value }: TransformFnParams): unknown[] {
  return Array.isArray(value) ? value : [value];
}

export class ImportBankStatementHttpDto {
  @ApiPropertyOptional({
    example: 'b1111111-1111-4111-8111-111111111111',
    description:
      'Conta bancária do extrato. **Obrigatório** (FR-001) — o cadastro não ' +
      'guarda agência/conta, então o código do banco do arquivo não é chave ' +
      'de casamento confiável; ele só pré-seleciona o campo via ' +
      '`POST /v1/bank-statements/preview`. Ausente → 422.',
  })
  // Continua `@IsOptional()` de propósito: quem recusa é o use case, que
  // distingue "não informou, mas há contas" (422 "Selecione a conta") de
  // "não informou porque não há nenhuma cadastrada" (422 "Cadastre uma conta").
  // Marcar como obrigatório aqui devolveria um erro de validação genérico e
  // perderia essa distinção, que é o que orienta o operador na tela.
  @IsOptional()
  @IsUUID()
  bankAccountId?: string;
}

export class ListBankStatementsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  bankAccountId?: string;

  @ApiPropertyOptional({ enum: BANK_STATEMENT_STATUSES })
  @IsOptional()
  @IsIn(BANK_STATEMENT_STATUSES)
  status?: (typeof BANK_STATEMENT_STATUSES)[number];

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 10, maximum: MAX_PER_PAGE })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PER_PAGE)
  perPage?: number;
}

export class ListStatementTransactionsQueryDto {
  @ApiProperty({ enum: ['pending', 'reconciled', 'discarded'] })
  @IsIn(['pending', 'reconciled', 'discarded'])
  status!: 'pending' | 'reconciled' | 'discarded';

  @ApiPropertyOptional({ description: 'Busca por memo (RN-15)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description:
      'Filtra por postedAt (FR-035/research.md D15) — rótulo na UI é "Período", nunca "vencimento"',
  })
  @IsOptional()
  @IsDateString()
  postedFrom?: string;

  @ApiPropertyOptional({
    description: 'Filtra por postedAt (FR-035/research.md D15)',
  })
  @IsOptional()
  @IsDateString()
  postedTo?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 10, maximum: MAX_PER_PAGE })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PER_PAGE)
  perPage?: number;
}

/**
 * FR-038, research.md D17 — filtros do drawer "Buscar Registros". Sem
 * `bankAccountId`: travado no servidor na conta do extrato (FR-037).
 */
export class SearchEligibleEntriesQueryDto {
  @ApiPropertyOptional({ description: 'Busca por descrição/parte' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @IsDateString()
  periodFrom?: string;

  @ApiPropertyOptional({ example: '2026-08-31' })
  @IsOptional()
  @IsDateString()
  periodTo?: string;

  @ApiPropertyOptional({
    enum: ELIGIBLE_ENTRY_PERIOD_TYPES,
    isArray: true,
    description:
      '"Buscar pelas datas de" — ausente aplica o intervalo às três datas',
  })
  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsIn(ELIGIBLE_ENTRY_PERIOD_TYPES, { each: true })
  periodType?: (typeof ELIGIBLE_ENTRY_PERIOD_TYPES)[number][];

  @ApiPropertyOptional({ description: 'Categoria (chartOfAccountId)' })
  @IsOptional()
  @IsUUID()
  chartOfAccountId?: string;

  @ApiPropertyOptional({
    description: 'Cliente — mutuamente exclusivo com supplierId',
  })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({
    description: 'Fornecedor — mutuamente exclusivo com customerId',
  })
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Bandeira' })
  @IsOptional()
  @IsString()
  cardBrand?: string;

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
