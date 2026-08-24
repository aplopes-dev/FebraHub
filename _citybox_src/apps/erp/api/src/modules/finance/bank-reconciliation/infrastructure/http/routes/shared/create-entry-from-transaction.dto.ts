import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/**
 * `operation`/`amountCents`/`dueDate`/`competenceDate` não entram aqui de
 * propósito — o servidor sempre deriva esses campos da transação
 * (contracts/bank-statement-transaction.contract.md), nunca confia neles
 * vindos do cliente. `chartOfAccountId`/`costCenterId` são obrigatórios
 * porque `FinancialEntry.create()` exige ao menos uma linha de rateio.
 */
export class CreateEntryFromTransactionHttpDto {
  @ApiProperty({ required: false, default: '' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @ApiProperty({ required: false, default: '' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  partyName?: string;

  /** Spec erp/031 D2 — mutuamente exclusivo com `supplierId`, checado no use-case. */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  /** Spec erp/031 D2 — mutuamente exclusivo com `customerId`, checado no use-case. */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiProperty({ required: false, default: '' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  categoryName?: string;

  @ApiProperty({ required: false, default: '' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({
    description:
      'Editável — pré-preenchido no cliente com a conta do extrato, mas o operador pode trocar (research.md D14)',
  })
  @IsUUID()
  bankAccountId!: string;

  @ApiProperty()
  @IsUUID()
  chartOfAccountId!: string;

  @ApiProperty()
  @IsUUID()
  costCenterId!: string;
}
