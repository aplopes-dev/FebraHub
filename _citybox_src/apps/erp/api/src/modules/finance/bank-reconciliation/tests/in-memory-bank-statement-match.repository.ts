import { BankStatementMatch } from '../domain/entities/bank-statement-match.entity';
import { BankStatementMatchRepository } from '../domain/repositories/bank-statement-match.repository.interface';

export class InMemoryBankStatementMatchRepository extends BankStatementMatchRepository {
  private readonly items = new Map<string, BankStatementMatch>();

  async findByTransactionId(
    organizationId: string,
    bankStatementTransactionId: string,
  ): Promise<BankStatementMatch[]> {
    return [...this.items.values()].filter(
      (item) =>
        item.organizationId === organizationId &&
        item.bankStatementTransactionId === bankStatementTransactionId,
    );
  }

  async findActiveFinancialEntryIds(
    organizationId: string,
    financialEntryIds: string[],
  ): Promise<Set<string>> {
    const wanted = new Set(financialEntryIds);
    const active = new Set<string>();
    for (const item of this.items.values()) {
      if (
        item.organizationId === organizationId &&
        wanted.has(item.financialEntryId)
      ) {
        active.add(item.financialEntryId);
      }
    }
    return active;
  }

  async saveMany(matches: BankStatementMatch[]): Promise<void> {
    for (const match of matches) {
      this.items.set(match.id, match);
    }
  }

  async deleteByTransactionId(
    organizationId: string,
    bankStatementTransactionId: string,
  ): Promise<void> {
    for (const [id, item] of this.items.entries()) {
      if (
        item.organizationId === organizationId &&
        item.bankStatementTransactionId === bankStatementTransactionId
      ) {
        this.items.delete(id);
      }
    }
  }
}
