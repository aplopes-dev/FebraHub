import {
  BankTransaction,
  type BankTransactionSourceType,
} from '../domain/entities/bank-transaction.entity';
import {
  BankTransactionRepository,
  type BankTransactionListCriteria,
} from '../domain/repositories/bank-transaction.repository.interface';

/**
 * Replica a mesma lógica de agregação/ordenação do repositório Prisma sobre
 * um array em memória — usado pelos `.spec.ts` de use case (mesmo padrão de
 * `InMemoryBankAccountRepository`/`InMemoryFinancialEntryRepository`).
 *
 * Ganha 2 métodos que **não** fazem parte de `BankTransactionRepository`
 * (produção nunca escreve através dessa interface — só lê, ver
 * `research.md` D1): `replaceBySource`/`insert`, usados pelos outros
 * repositórios in-memory (`InMemoryBankAccountRepository`,
 * `InMemoryFinancialEntryRepository`) para espelhar a sincronização que os
 * repositórios Prisma reais fazem via `tx.bankTransaction.*`.
 */
export class InMemoryBankTransactionRepository extends BankTransactionRepository {
  private readonly items = new Map<string, BankTransaction>();

  async sumBalancesByAccountIds(
    organizationId: string,
    bankAccountIds: string[],
  ): Promise<Record<string, number>> {
    const balances: Record<string, number> = {};
    for (const item of this.items.values()) {
      if (item.organizationId !== organizationId) continue;
      if (!bankAccountIds.includes(item.bankAccountId)) continue;
      balances[item.bankAccountId] =
        (balances[item.bankAccountId] ?? 0) + item.signedAmountCents;
    }
    return balances;
  }

  async countByAccount(
    organizationId: string,
    bankAccountId: string,
    criteria: Omit<BankTransactionListCriteria, 'skip' | 'take'> = {},
  ): Promise<number> {
    return this.filter(organizationId, bankAccountId, criteria).length;
  }

  async findByAccount(
    organizationId: string,
    bankAccountId: string,
    criteria: BankTransactionListCriteria,
  ): Promise<BankTransaction[]> {
    const list = this.filter(organizationId, bankAccountId, criteria);
    const skip = criteria.skip ?? 0;
    const take = criteria.take;
    return take === undefined
      ? list.slice(skip)
      : list.slice(skip, skip + take);
  }

  async findOrderedThrough(
    organizationId: string,
    bankAccountId: string,
    limit: number,
  ): Promise<BankTransaction[]> {
    return this.filter(organizationId, bankAccountId, {}).slice(0, limit);
  }

  /**
   * Espelha `tx.bankTransaction.deleteMany` + `createMany` escopados por
   * `(organizationId, sourceType, sourceId)` — usado pela sincronização de
   * saldo inicial (`BankAccount`) e de pagamento de lançamento
   * (`FinancialEntry`).
   */
  replaceBySource(
    organizationId: string,
    sourceType: BankTransactionSourceType,
    sourceId: string,
    transactions: BankTransaction[],
  ): void {
    for (const [id, item] of this.items) {
      if (
        item.organizationId === organizationId &&
        item.sourceType === sourceType &&
        item.sourceId === sourceId
      ) {
        this.items.delete(id);
      }
    }
    for (const transaction of transactions) {
      this.items.set(transaction.id, transaction);
    }
  }

  /** Espelha um único `tx.bankTransaction.create()` direto (ex.: recebível de venda). */
  insert(transaction: BankTransaction): void {
    this.items.set(transaction.id, transaction);
  }

  private filter(
    organizationId: string,
    bankAccountId: string,
    criteria: Omit<BankTransactionListCriteria, 'skip' | 'take'>,
  ): BankTransaction[] {
    return [...this.items.values()]
      .filter(
        (item) =>
          item.organizationId === organizationId &&
          item.bankAccountId === bankAccountId,
      )
      .filter((item) => !criteria.kind || item.kind === criteria.kind)
      .filter(
        (item) =>
          !criteria.effectiveFrom || item.effectiveAt >= criteria.effectiveFrom,
      )
      .filter(
        (item) =>
          !criteria.effectiveTo || item.effectiveAt <= criteria.effectiveTo,
      )
      .sort((a, b) => {
        const byDate = b.effectiveAt.getTime() - a.effectiveAt.getTime();
        if (byDate !== 0) return byDate;
        const byCreated = b.createdAt.getTime() - a.createdAt.getTime();
        if (byCreated !== 0) return byCreated;
        return b.id.localeCompare(a.id);
      });
  }
}
