import type { BankStatementCounts } from '../domain/entities/bank-statement.entity';
import { BankStatementTransaction } from '../domain/entities/bank-statement-transaction.entity';
import {
  BankStatementTransactionRepository,
  type BankStatementTransactionListCriteria,
} from '../domain/repositories/bank-statement-transaction.repository.interface';

export class InMemoryBankStatementTransactionRepository extends BankStatementTransactionRepository {
  private readonly items = new Map<string, BankStatementTransaction>();

  async findById(
    organizationId: string,
    id: string,
  ): Promise<BankStatementTransaction | null> {
    const item = this.items.get(id);
    if (!item || item.organizationId !== organizationId) return null;
    return item;
  }

  async findByStatement(
    organizationId: string,
    bankStatementId: string,
    criteria: BankStatementTransactionListCriteria,
  ): Promise<BankStatementTransaction[]> {
    return this.filter(organizationId, bankStatementId, criteria);
  }

  async count(
    organizationId: string,
    bankStatementId: string,
    criteria: Omit<BankStatementTransactionListCriteria, 'skip' | 'take'>,
  ): Promise<number> {
    return this.filter(organizationId, bankStatementId, criteria).length;
  }

  async countByStatement(
    organizationId: string,
    bankStatementId: string,
  ): Promise<BankStatementCounts> {
    const all = [...this.items.values()].filter(
      (item) =>
        item.organizationId === organizationId &&
        item.bankStatementId === bankStatementId,
    );
    return {
      pendingCount: all.filter((item) => item.status === 'pending').length,
      reconciledCount: all.filter((item) => item.status === 'reconciled')
        .length,
      discardedCount: all.filter((item) => item.status === 'discarded').length,
    };
  }

  async findExistingDedupeKeys(
    organizationId: string,
    dedupeKeys: string[],
  ): Promise<Set<string>> {
    const keys = new Set(dedupeKeys);
    const existing = new Set<string>();
    for (const item of this.items.values()) {
      // Excluída não bloqueia reimportação (ver interface do repositório).
      if (
        item.organizationId === organizationId &&
        item.status !== 'discarded' &&
        keys.has(item.dedupeKey)
      ) {
        existing.add(item.dedupeKey);
      }
    }
    return existing;
  }

  async deleteByStatement(
    organizationId: string,
    bankStatementId: string,
  ): Promise<void> {
    for (const [id, item] of this.items.entries()) {
      if (
        item.organizationId === organizationId &&
        item.bankStatementId === bankStatementId
      ) {
        this.items.delete(id);
      }
    }
  }

  async deleteDiscardedByDedupeKeys(
    organizationId: string,
    dedupeKeys: string[],
  ): Promise<string[]> {
    const keys = new Set(dedupeKeys);
    const affected = new Set<string>();
    for (const [id, item] of this.items.entries()) {
      if (
        item.organizationId === organizationId &&
        item.status === 'discarded' &&
        keys.has(item.dedupeKey)
      ) {
        affected.add(item.bankStatementId);
        this.items.delete(id);
      }
    }
    return [...affected];
  }

  async save(
    transaction: BankStatementTransaction,
  ): Promise<BankStatementTransaction> {
    this.items.set(transaction.id, transaction);
    return transaction;
  }

  async saveMany(transactions: BankStatementTransaction[]): Promise<void> {
    for (const transaction of transactions) {
      this.items.set(transaction.id, transaction);
    }
  }

  private filter(
    organizationId: string,
    bankStatementId: string,
    criteria: BankStatementTransactionListCriteria,
  ): BankStatementTransaction[] {
    let list = [...this.items.values()]
      .filter(
        (item) =>
          item.organizationId === organizationId &&
          item.bankStatementId === bankStatementId &&
          item.status === criteria.status,
      )
      .sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime());

    const search = criteria.search?.trim().toLowerCase();
    if (search) {
      list = list.filter((item) => item.memo.toLowerCase().includes(search));
    }

    if (criteria.postedFrom) {
      const from = criteria.postedFrom;
      list = list.filter((item) => item.postedAt.getTime() >= from.getTime());
    }
    if (criteria.postedTo) {
      const to = criteria.postedTo;
      list = list.filter((item) => item.postedAt.getTime() <= to.getTime());
    }

    const skip = criteria.skip ?? 0;
    const take = criteria.take;
    return take === undefined
      ? list.slice(skip)
      : list.slice(skip, skip + take);
  }
}
