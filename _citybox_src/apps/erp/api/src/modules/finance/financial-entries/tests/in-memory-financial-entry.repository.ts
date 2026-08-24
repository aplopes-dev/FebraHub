import { FinancialEntry } from '../domain/entities/financial-entry.entity';
import {
  FinancialEntryRepository,
  type FinancialEntryListCriteria,
  type FinancialEntryTabCounts,
  type FinancialEntryReconciliationCandidate,
  type ReconciliationCandidateCriteria,
} from '../domain/repositories/financial-entry.repository.interface';
import { BankTransaction } from '../../bank-accounts/domain/entities/bank-transaction.entity';
import type { InMemoryBankTransactionRepository } from '../../bank-accounts/tests/in-memory-bank-transaction.repository';
import { deriveBankTransactionInputsFromEntry } from '../domain/services/derive-bank-transaction-inputs';

/**
 * `save()`/`softDelete()`/`clearDeletedAt()` sincronizam (apaga + recria) as
 * `BankTransaction` de origem `financial_entry_payment` na
 * `InMemoryBankTransactionRepository` compartilhada — espelha o que
 * `PrismaFinancialEntryRepository` faz de verdade dentro da sua
 * `$transaction` (ver `specs/erp/002-bank-account-ledger/research.md` D1).
 */
export class InMemoryFinancialEntryRepository extends FinancialEntryRepository {
  private readonly items = new Map<string, FinancialEntry>();

  constructor(
    private readonly bankTransactionRepository: InMemoryBankTransactionRepository,
  ) {
    super();
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<FinancialEntry | null> {
    const item = this.items.get(id);
    if (!item || item.organizationId !== organizationId) return null;
    return item;
  }

  async findAll(
    organizationId: string,
    criteria: FinancialEntryListCriteria = {},
  ): Promise<FinancialEntry[]> {
    return this.filter(organizationId, criteria);
  }

  async count(
    organizationId: string,
    criteria: Omit<FinancialEntryListCriteria, 'skip' | 'take'> = {},
  ): Promise<number> {
    return this.filter(organizationId, criteria).length;
  }

  async countByTabs(organizationId: string): Promise<FinancialEntryTabCounts> {
    return {
      active: this.filter(organizationId, { tab: 'active' }).length,
      deleted: this.filter(organizationId, { tab: 'deleted' }).length,
    };
  }

  async sumAmountsByOperation(
    organizationId: string,
    criteria: Omit<FinancialEntryListCriteria, 'skip' | 'take'> = {},
  ): Promise<{ operation: FinancialEntry['operation']; totalCents: number }[]> {
    const list = this.filter(organizationId, criteria);
    const totals = new Map<FinancialEntry['operation'], number>();
    for (const item of list) {
      // Espelha o `groupBy(_sum: { amountCents: true })` do Prisma — soma o
      // valor base do lançamento, não `totalCents` (amountCents+fees+fines).
      totals.set(
        item.operation,
        (totals.get(item.operation) ?? 0) + item.amountCents,
      );
    }
    return [...totals.entries()].map(([operation, totalCents]) => ({
      operation,
      totalCents,
    }));
  }

  async findReconciliationCandidates(
    organizationId: string,
    criteria: ReconciliationCandidateCriteria,
  ): Promise<FinancialEntryReconciliationCandidate[]> {
    const from = criteria.dueDateFrom.getTime();
    const to = criteria.dueDateTo.getTime();
    return [...this.items.values()]
      .filter(
        (item) =>
          item.organizationId === organizationId &&
          !item.deletedAt &&
          item.status === 'pending' &&
          (criteria.bankAccountId === undefined ||
            item.bankAccountId === criteria.bankAccountId) &&
          item.operation === criteria.operation &&
          item.dueDate.getTime() >= from &&
          item.dueDate.getTime() <= to,
      )
      .map((item) => ({
        financialEntryId: item.id,
        openBalanceCents: item.amountCents - item.paidCents,
        dueDate: item.dueDate,
        description: item.description || item.partyName,
      }));
  }

  async save(entry: FinancialEntry): Promise<FinancialEntry> {
    this.items.set(entry.id, entry);
    this.syncLedgerMovements(entry);
    return entry;
  }

  async softDelete(
    organizationId: string,
    id: string,
    deletedAt: Date,
  ): Promise<void> {
    const item = await this.findById(organizationId, id);
    if (!item) return;

    this.items.set(
      id,
      FinancialEntry.with(
        { ...item.props, deletedAt, updatedAt: deletedAt },
        item.id,
      ),
    );
    this.bankTransactionRepository.replaceBySource(
      organizationId,
      'financial_entry_payment',
      id,
      [],
    );
  }

  async clearDeletedAt(
    organizationId: string,
    id: string,
    updatedAt: Date,
  ): Promise<void> {
    const item = await this.findById(organizationId, id);
    if (!item) return;

    const restored = FinancialEntry.with(
      { ...item.props, deletedAt: null, updatedAt },
      item.id,
    );
    this.items.set(id, restored);
    this.syncLedgerMovements(restored);
  }

  /** Espelha `tx.bankTransaction.deleteMany` + `createMany` de `save()`/`clearDeletedAt()` Prisma. */
  private syncLedgerMovements(entry: FinancialEntry): void {
    const inputs = deriveBankTransactionInputsFromEntry(entry);
    const movements = inputs.map((input) =>
      BankTransaction.create({
        organizationId: entry.organizationId,
        bankAccountId: entry.bankAccountId!,
        kind: input.kind,
        description: input.description,
        amountCents: input.amountCents,
        effectiveAt: input.effectiveAt,
        sourceType: 'financial_entry_payment',
        sourceId: entry.id,
      }),
    );
    this.bankTransactionRepository.replaceBySource(
      entry.organizationId,
      'financial_entry_payment',
      entry.id,
      movements,
    );
  }

  private filter(
    organizationId: string,
    criteria: FinancialEntryListCriteria,
  ): FinancialEntry[] {
    const search = criteria.search?.trim().toLowerCase();
    const wantsDeleted = criteria.tab === 'deleted';

    let list = [...this.items.values()]
      .filter((item) => item.organizationId === organizationId)
      .filter((item) => (wantsDeleted ? !!item.deletedAt : !item.deletedAt));

    if (criteria.operation) {
      list = list.filter((item) => item.operation === criteria.operation);
    }

    if (criteria.status?.length) {
      list = list.filter((item) => criteria.status!.includes(item.status));
    }

    if (criteria.chartOfAccountId?.length) {
      list = list.filter((item) =>
        item.allocations.some((allocation) =>
          criteria.chartOfAccountId!.includes(allocation.chartOfAccountId),
        ),
      );
    }

    if (criteria.costCenterId?.length) {
      list = list.filter((item) =>
        item.allocations.some((allocation) =>
          criteria.costCenterId!.includes(allocation.costCenterId),
        ),
      );
    }

    if (search) {
      list = list.filter(
        (item) =>
          item.description.toLowerCase().includes(search) ||
          item.partyName.toLowerCase().includes(search),
      );
    }

    if (criteria.dueFrom) {
      const from = criteria.dueFrom.getTime();
      list = list.filter((item) => item.dueDate.getTime() >= from);
    }

    if (criteria.dueTo) {
      const to = criteria.dueTo.getTime();
      list = list.filter((item) => item.dueDate.getTime() <= to);
    }

    if (criteria.competenceFrom) {
      const from = criteria.competenceFrom.getTime();
      list = list.filter((item) => item.competenceDate.getTime() >= from);
    }

    if (criteria.competenceTo) {
      const to = criteria.competenceTo.getTime();
      list = list.filter((item) => item.competenceDate.getTime() <= to);
    }

    if (criteria.bankAccountId) {
      list = list.filter(
        (item) => item.bankAccountId === criteria.bankAccountId,
      );
    }

    if (criteria.customerId) {
      list = list.filter((item) => item.customerId === criteria.customerId);
    }

    if (criteria.supplierId) {
      list = list.filter((item) => item.supplierId === criteria.supplierId);
    }

    if (
      criteria.paidFrom ||
      criteria.paidTo ||
      criteria.paymentMethod ||
      criteria.cardBrand
    ) {
      list = list.filter((item) =>
        item.payments.some((payment) => {
          if (
            criteria.paidFrom &&
            payment.paidAt.getTime() < criteria.paidFrom.getTime()
          ) {
            return false;
          }
          if (
            criteria.paidTo &&
            payment.paidAt.getTime() > criteria.paidTo.getTime()
          ) {
            return false;
          }
          if (
            criteria.paymentMethod &&
            payment.paymentMethod !== criteria.paymentMethod
          ) {
            return false;
          }
          if (criteria.cardBrand && payment.cardBrand !== criteria.cardBrand) {
            return false;
          }
          return true;
        }),
      );
    }

    list = list.sort(this.compareBySort(criteria.sort));

    const skip = criteria.skip ?? 0;
    const take = criteria.take;
    return take === undefined
      ? list.slice(skip)
      : list.slice(skip, skip + take);
  }

  private compareBySort(
    sort: FinancialEntryListCriteria['sort'],
  ): (a: FinancialEntry, b: FinancialEntry) => number {
    switch (sort) {
      case 'due_date_asc':
        return (a, b) => a.dueDate.getTime() - b.dueDate.getTime();
      case 'amount_asc':
        return (a, b) => a.totalCents - b.totalCents;
      case 'amount_desc':
        return (a, b) => b.totalCents - a.totalCents;
      case 'created_at_desc':
        return (a, b) => b.createdAt.getTime() - a.createdAt.getTime();
      case 'due_date_desc':
      default:
        // Vencimento decrescente, como no Prisma — default histórico.
        return (a, b) => b.dueDate.getTime() - a.dueDate.getTime();
    }
  }
}
