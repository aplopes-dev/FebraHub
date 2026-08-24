import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../../../generated/prisma/client';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import {
  BankStatementTransaction,
  type BankStatementTransactionProps,
} from '../../domain/entities/bank-statement-transaction.entity';
import {
  BankStatementTransactionRepository,
  type BankStatementTransactionListCriteria,
} from '../../domain/repositories/bank-statement-transaction.repository.interface';
import type { BankStatementCounts } from '../../domain/entities/bank-statement.entity';

type BankStatementTransactionRow = {
  id: string;
  organizationId: string;
  bankStatementId: string;
  bankAccountId: string | null;
  fitId: string;
  dedupeKey: string;
  postedAt: Date;
  amountCents: number;
  kind: BankStatementTransactionProps['kind'];
  transactionType: string;
  memo: string;
  status: BankStatementTransactionProps['status'];
  reconciledAt: Date | null;
  discardedAt: Date | null;
  createdAt: Date;
};

/** Usa `prisma.scoped` — mesmo raciocínio de `PrismaBankAccountRepository`. */
@Injectable()
export class PrismaBankStatementTransactionRepository extends BankStatementTransactionRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<BankStatementTransaction | null> {
    const row = await this.prisma.scoped.bankStatementTransaction.findFirst({
      where: { id, organizationId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByStatement(
    organizationId: string,
    bankStatementId: string,
    criteria: BankStatementTransactionListCriteria,
  ): Promise<BankStatementTransaction[]> {
    const rows = await this.prisma.scoped.bankStatementTransaction.findMany({
      where: this.buildWhere(organizationId, bankStatementId, criteria),
      orderBy: [{ postedAt: 'desc' }, { createdAt: 'desc' }],
      skip: criteria.skip,
      take: criteria.take,
    });
    return rows.map((row) => this.toEntity(row));
  }

  count(
    organizationId: string,
    bankStatementId: string,
    criteria: Omit<BankStatementTransactionListCriteria, 'skip' | 'take'>,
  ): Promise<number> {
    return this.prisma.scoped.bankStatementTransaction.count({
      where: this.buildWhere(organizationId, bankStatementId, criteria),
    });
  }

  async countByStatement(
    organizationId: string,
    bankStatementId: string,
  ): Promise<BankStatementCounts> {
    const [pendingCount, reconciledCount, discardedCount] = await Promise.all([
      this.prisma.scoped.bankStatementTransaction.count({
        where: { organizationId, bankStatementId, status: 'pending' },
      }),
      this.prisma.scoped.bankStatementTransaction.count({
        where: { organizationId, bankStatementId, status: 'reconciled' },
      }),
      this.prisma.scoped.bankStatementTransaction.count({
        where: { organizationId, bankStatementId, status: 'discarded' },
      }),
    ]);
    return { pendingCount, reconciledCount, discardedCount };
  }

  async findExistingDedupeKeys(
    organizationId: string,
    dedupeKeys: string[],
  ): Promise<Set<string>> {
    if (dedupeKeys.length === 0) return new Set();
    const rows = await this.prisma.scoped.bankStatementTransaction.findMany({
      // `status: { not: 'discarded' }` — uma transação excluída não bloqueia a
      // reimportação do arquivo (ver a interface do repositório).
      where: {
        organizationId,
        dedupeKey: { in: dedupeKeys },
        status: { not: 'discarded' },
      },
      select: { dedupeKey: true },
    });
    return new Set(rows.map((row) => row.dedupeKey));
  }

  async deleteByStatement(
    organizationId: string,
    bankStatementId: string,
  ): Promise<void> {
    await this.prisma.scoped.bankStatementTransaction.deleteMany({
      where: { organizationId, bankStatementId },
    });
  }

  async deleteDiscardedByDedupeKeys(
    organizationId: string,
    dedupeKeys: string[],
  ): Promise<string[]> {
    if (dedupeKeys.length === 0) return [];
    const where = {
      organizationId,
      status: 'discarded' as const,
      dedupeKey: { in: dedupeKeys },
    };
    // Lê os extratos afetados antes de apagar — depois do delete não há como
    // saber quais contadores recalcular.
    const affected = await this.prisma.scoped.bankStatementTransaction.findMany(
      {
        where,
        select: { bankStatementId: true },
        distinct: ['bankStatementId'],
      },
    );
    await this.prisma.scoped.bankStatementTransaction.deleteMany({ where });
    return affected.map((row) => row.bankStatementId);
  }

  async save(
    transaction: BankStatementTransaction,
  ): Promise<BankStatementTransaction> {
    const row = await this.prisma.scoped.bankStatementTransaction.update({
      where: { id: transaction.id },
      data: {
        status: transaction.status,
        reconciledAt: transaction.reconciledAt,
        discardedAt: transaction.discardedAt,
      },
    });
    return this.toEntity(row);
  }

  async saveMany(transactions: BankStatementTransaction[]): Promise<void> {
    if (transactions.length === 0) return;
    await this.prisma.scoped.bankStatementTransaction.createMany({
      data: transactions.map((transaction) => ({
        id: transaction.id,
        organizationId: transaction.organizationId,
        bankStatementId: transaction.bankStatementId,
        bankAccountId: transaction.bankAccountId,
        fitId: transaction.fitId,
        dedupeKey: transaction.dedupeKey,
        postedAt: transaction.postedAt,
        amountCents: transaction.amountCents,
        kind: transaction.kind,
        transactionType: transaction.transactionType,
        memo: transaction.memo,
        status: transaction.status,
      })),
    });
  }

  private buildWhere(
    organizationId: string,
    bankStatementId: string,
    criteria: Omit<BankStatementTransactionListCriteria, 'skip' | 'take'>,
  ): Prisma.BankStatementTransactionWhereInput {
    const where: Prisma.BankStatementTransactionWhereInput = {
      organizationId,
      bankStatementId,
      status: criteria.status,
    };
    const search = criteria.search?.trim();
    if (search) {
      where.memo = { contains: search, mode: 'insensitive' };
    }
    if (criteria.postedFrom || criteria.postedTo) {
      where.postedAt = {
        ...(criteria.postedFrom ? { gte: criteria.postedFrom } : {}),
        ...(criteria.postedTo ? { lte: criteria.postedTo } : {}),
      };
    }
    return where;
  }

  private toEntity(row: BankStatementTransactionRow): BankStatementTransaction {
    const props: BankStatementTransactionProps = {
      organizationId: row.organizationId,
      bankStatementId: row.bankStatementId,
      bankAccountId: row.bankAccountId,
      fitId: row.fitId,
      dedupeKey: row.dedupeKey,
      postedAt: row.postedAt,
      amountCents: row.amountCents,
      kind: row.kind,
      transactionType: row.transactionType,
      memo: row.memo,
      status: row.status,
      reconciledAt: row.reconciledAt,
      discardedAt: row.discardedAt,
      createdAt: row.createdAt,
    };
    return BankStatementTransaction.with(props, row.id);
  }
}
