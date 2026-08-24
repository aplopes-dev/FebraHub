import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import {
  BankTransfer,
  type BankTransferProps,
} from '../../domain/entities/bank-transfer.entity';
import { BankTransferRepository } from '../../domain/repositories/bank-transfer.repository.interface';

type BankTransferRow = {
  id: string;
  organizationId: string;
  fromBankAccountId: string;
  toBankAccountId: string;
  amountCents: number;
  effectiveAt: Date;
  paymentMethod: string;
  costCenterId: string;
  description: string;
  createdByName: string;
  createdAt: Date;
};

/**
 * `save()` grava, numa única transação (FR-010): a `BankTransfer` + as 2
 * `BankTransaction` vinculadas (débito na origem, crédito no destino) — via
 * `tx.bankTransaction.*` direto, mesmo padrão de
 * `PrismaBankAccountRepository`/`PrismaFinancialEntryRepository`.
 */
@Injectable()
export class PrismaBankTransferRepository extends BankTransferRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async save(bankTransfer: BankTransfer): Promise<BankTransfer> {
    const description = bankTransfer.description || 'Transferência';

    const row = await this.prisma.scoped.$transaction(async (tx) => {
      const saved = await tx.bankTransfer.create({
        data: {
          id: bankTransfer.id,
          organizationId: bankTransfer.organizationId,
          fromBankAccountId: bankTransfer.fromBankAccountId,
          toBankAccountId: bankTransfer.toBankAccountId,
          amountCents: bankTransfer.amountCents,
          effectiveAt: bankTransfer.effectiveAt,
          paymentMethod: bankTransfer.paymentMethod,
          costCenterId: bankTransfer.costCenterId,
          description: bankTransfer.description,
          createdByName: bankTransfer.createdByName,
          createdAt: bankTransfer.createdAt,
        },
      });

      await tx.bankTransaction.createMany({
        data: [
          {
            organizationId: bankTransfer.organizationId,
            bankAccountId: bankTransfer.fromBankAccountId,
            kind: 'debit',
            description: `Transferência enviada — ${description}`,
            amountCents: bankTransfer.amountCents,
            effectiveAt: bankTransfer.effectiveAt,
            sourceType: 'bank_transfer',
            sourceId: bankTransfer.id,
            createdByName: bankTransfer.createdByName,
          },
          {
            organizationId: bankTransfer.organizationId,
            bankAccountId: bankTransfer.toBankAccountId,
            kind: 'credit',
            description: `Transferência recebida — ${description}`,
            amountCents: bankTransfer.amountCents,
            effectiveAt: bankTransfer.effectiveAt,
            sourceType: 'bank_transfer',
            sourceId: bankTransfer.id,
            createdByName: bankTransfer.createdByName,
          },
        ],
      });

      return saved;
    });

    return this.toEntity(row);
  }

  private toEntity(row: BankTransferRow): BankTransfer {
    const props: BankTransferProps = {
      organizationId: row.organizationId,
      fromBankAccountId: row.fromBankAccountId,
      toBankAccountId: row.toBankAccountId,
      amountCents: row.amountCents,
      effectiveAt: row.effectiveAt,
      paymentMethod: row.paymentMethod,
      costCenterId: row.costCenterId,
      description: row.description,
      createdByName: row.createdByName,
      createdAt: row.createdAt,
    };
    return BankTransfer.with(props, row.id);
  }
}
