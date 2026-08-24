import { FinancialAccount } from '../domain/entities/financial-account.entity';
import { FinancialAccountRepository } from '../domain/repositories/financial-account.repository.interface';

export class InMemoryFinancialAccountRepository extends FinancialAccountRepository {
  private items: FinancialAccount[] = [];

  seed(accounts: FinancialAccount[]): void {
    this.items = [...accounts];
  }

  async findById(
    storeId: string,
    id: string,
  ): Promise<FinancialAccount | null> {
    return (
      this.items.find((item) => item.id === id && item.storeId === storeId) ??
      null
    );
  }

  async findMany(
    storeId: string,
    options?: { includeInactive?: boolean },
  ): Promise<FinancialAccount[]> {
    return this.items
      .filter((item) => item.storeId === storeId)
      .filter((item) => (options?.includeInactive ? true : item.isActive))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async save(account: FinancialAccount): Promise<FinancialAccount> {
    const index = this.items.findIndex((item) => item.id === account.id);
    if (index === -1) {
      this.items = [...this.items, account];
    } else {
      this.items = this.items.map((item) =>
        item.id === account.id ? account : item,
      );
    }
    return account;
  }

  async delete(storeId: string, id: string): Promise<void> {
    this.items = this.items.filter(
      (item) => !(item.id === id && item.storeId === storeId),
    );
  }
}
