import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../../../generated/prisma/client';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import {
  BankTransaction,
  type BankTransactionProps,
} from '../../domain/entities/bank-transaction.entity';
import {
  BankTransactionRepository,
  type BankTransactionListCriteria,
} from '../../domain/repositories/bank-transaction.repository.interface';

type BankTransactionRow = {
  id: string;
  organizationId: string;
  bankAccountId: string;
  kind: BankTransactionProps['kind'];
  description: string;
  amountCents: number;
  effectiveAt: Date;
  sourceType: BankTransactionProps['sourceType'];
  sourceId: string | null;
  createdByName: string;
  createdAt: Date;
};

/** Mais recente primeiro; `createdAt`/`id` desempatam a mesma `effectiveAt` — tiebreak determinístico (research.md D7). */
const ORDER_BY: Prisma.BankTransactionOrderByWithRelationInput[] = [
  { effectiveAt: 'desc' },
  { createdAt: 'desc' },
  { id: 'desc' },
];

/**
 * Usa `prisma.scoped`: o filtro global injeta o `organizationId` do contexto em
 * toda query, mesmo nas que já o passam explicitamente aqui. As duas travas são
 * de propósito — uma pega o esquecimento, a outra o bug de chamada.
 *
 * Só leitura — quem escreve em `bank_transactions` é cada agregado de origem
 * (`BankAccount`, `FinancialEntry`, `BankTransfer`), direto via `tx.bankTransaction.*`
 * dentro da própria transação (ver `research.md` D1 de 002-bank-account-ledger).
 */
@Injectable()
export class PrismaBankTransactionRepository extends BankTransactionRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  /**
   * Saldo por conta via um único `groupBy` (research.md D2) — reduzido em
   * código porque o Prisma não soma com sinal condicional ao tipo dentro do
   * agregado.
   */
  async sumBalancesByAccountIds(
    organizationId: string,
    bankAccountIds: string[],
  ): Promise<Record<string, number>> {
    if (bankAccountIds.length === 0) return {};

    const groups = await this.prisma.scoped.bankTransaction.groupBy({
      by: ['bankAccountId', 'kind'],
      where: { organizationId, bankAccountId: { in: bankAccountIds } },
      _sum: { amountCents: true },
    });

    const balances: Record<string, number> = {};
    for (const group of groups) {
      const sum = group._sum.amountCents ?? 0;
      const signed = group.kind === 'debit' ? -sum : sum;
      balances[group.bankAccountId] =
        (balances[group.bankAccountId] ?? 0) + signed;
    }
    return balances;
  }

  countByAccount(
    organizationId: string,
    bankAccountId: string,
    criteria: Omit<BankTransactionListCriteria, 'skip' | 'take'> = {},
  ): Promise<number> {
    return this.prisma.scoped.bankTransaction.count({
      where: this.buildWhere(organizationId, bankAccountId, criteria),
    });
  }

  async findByAccount(
    organizationId: string,
    bankAccountId: string,
    criteria: BankTransactionListCriteria,
  ): Promise<BankTransaction[]> {
    const rows = await this.prisma.scoped.bankTransaction.findMany({
      where: this.buildWhere(organizationId, bankAccountId, criteria),
      orderBy: ORDER_BY,
      skip: criteria.skip,
      take: criteria.take,
    });
    return rows.map((row) => this.toEntity(row));
  }

  async findOrderedThrough(
    organizationId: string,
    bankAccountId: string,
    limit: number,
  ): Promise<BankTransaction[]> {
    const rows = await this.prisma.scoped.bankTransaction.findMany({
      where: { organizationId, bankAccountId },
      orderBy: ORDER_BY,
      take: limit,
    });
    return rows.map((row) => this.toEntity(row));
  }

  private buildWhere(
    organizationId: string,
    bankAccountId: string,
    criteria: Omit<BankTransactionListCriteria, 'skip' | 'take'>,
  ): Prisma.BankTransactionWhereInput {
    const and: Prisma.BankTransactionWhereInput[] = [];

    if (criteria.kind) and.push({ kind: criteria.kind });

    if (criteria.effectiveFrom || criteria.effectiveTo) {
      and.push({
        effectiveAt: {
          ...(criteria.effectiveFrom ? { gte: criteria.effectiveFrom } : {}),
          ...(criteria.effectiveTo ? { lte: criteria.effectiveTo } : {}),
        },
      });
    }

    return { organizationId, bankAccountId, AND: and };
  }

  private toEntity(row: BankTransactionRow): BankTransaction {
    const props: BankTransactionProps = {
      organizationId: row.organizationId,
      bankAccountId: row.bankAccountId,
      kind: row.kind,
      description: row.description,
      amountCents: row.amountCents,
      effectiveAt: row.effectiveAt,
      sourceType: row.sourceType,
      sourceId: row.sourceId,
      createdByName: row.createdByName,
      createdAt: row.createdAt,
    };
    return BankTransaction.with(props, row.id);
  }
}
