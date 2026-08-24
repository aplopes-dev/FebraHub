import { BankAccount } from '../domain/entities/bank-account.entity';
import { BankTransaction } from '../domain/entities/bank-transaction.entity';
import {
  BankAccountRepository,
  type BankAccountListCriteria,
  type BankAccountTabCounts,
} from '../domain/repositories/bank-account.repository.interface';
import type { InMemoryBankTransactionRepository } from './in-memory-bank-transaction.repository';

/**
 * `save()` sincroniza (apaga + recria se `openingBalanceCents > 0`) a
 * movimentação `initial_balance` na `InMemoryBankTransactionRepository`
 * compartilhada — espelha o que `PrismaBankAccountRepository.save()` faz de
 * verdade dentro da sua `$transaction` (ver
 * `specs/erp/002-bank-account-ledger/research.md` D1).
 */
export class InMemoryBankAccountRepository extends BankAccountRepository {
  private readonly items = new Map<string, BankAccount>();

  constructor(
    private readonly bankTransactionRepository: InMemoryBankTransactionRepository,
  ) {
    super();
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<BankAccount | null> {
    const item = this.items.get(id);
    if (!item || item.organizationId !== organizationId) return null;
    return item;
  }

  async findAll(
    organizationId: string,
    criteria: BankAccountListCriteria = {},
  ): Promise<BankAccount[]> {
    return this.filter(organizationId, criteria);
  }

  async count(
    organizationId: string,
    criteria: Omit<BankAccountListCriteria, 'skip' | 'take'> = {},
  ): Promise<number> {
    return this.filter(organizationId, criteria).length;
  }

  async countByTabs(organizationId: string): Promise<BankAccountTabCounts> {
    return {
      active: this.filter(organizationId, { tab: 'active' }).length,
      deleted: this.filter(organizationId, { tab: 'deleted' }).length,
    };
  }

  async findActiveByBankCode(
    organizationId: string,
    bankCode: string,
  ): Promise<BankAccount[]> {
    const trimmed = bankCode.trim();
    if (!trimmed) return [];
    return [...this.items.values()].filter(
      (item) =>
        item.organizationId === organizationId &&
        !item.deletedAt &&
        item.bankCode === trimmed,
    );
  }

  async save(bankAccount: BankAccount): Promise<BankAccount> {
    this.items.set(bankAccount.id, bankAccount);

    const movements =
      bankAccount.openingBalanceCents > 0
        ? [
            BankTransaction.create({
              organizationId: bankAccount.organizationId,
              bankAccountId: bankAccount.id,
              kind: 'initial_balance',
              description: 'Saldo inicial da conta',
              amountCents: bankAccount.openingBalanceCents,
              effectiveAt: bankAccount.openedAt,
              sourceType: 'initial_balance',
              sourceId: bankAccount.id,
            }),
          ]
        : [];
    this.bankTransactionRepository.replaceBySource(
      bankAccount.organizationId,
      'initial_balance',
      bankAccount.id,
      movements,
    );

    return bankAccount;
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
      BankAccount.with(
        { ...item.props, deletedAt, updatedAt: deletedAt },
        item.id,
      ),
    );
  }

  async clearDeletedAt(
    organizationId: string,
    id: string,
    updatedAt: Date,
  ): Promise<void> {
    const item = await this.findById(organizationId, id);
    if (!item) return;

    this.items.set(
      id,
      BankAccount.with({ ...item.props, deletedAt: null, updatedAt }, item.id),
    );
  }

  private filter(
    organizationId: string,
    criteria: BankAccountListCriteria,
  ): BankAccount[] {
    const search = criteria.search?.trim().toLowerCase();
    const wantsDeleted = criteria.tab === 'deleted';

    let list = [...this.items.values()]
      .filter((item) => item.organizationId === organizationId)
      .filter((item) => (wantsDeleted ? !!item.deletedAt : !item.deletedAt))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

    if (search) {
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(search) ||
          item.bankName.toLowerCase().includes(search),
      );
    }

    const skip = criteria.skip ?? 0;
    const take = criteria.take;
    return take === undefined
      ? list.slice(skip)
      : list.slice(skip, skip + take);
  }
}
