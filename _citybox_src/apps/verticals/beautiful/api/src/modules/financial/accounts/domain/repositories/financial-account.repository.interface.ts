import type { FinancialAccount } from '../entities/financial-account.entity';

export abstract class FinancialAccountRepository {
  abstract findById(
    storeId: string,
    id: string,
  ): Promise<FinancialAccount | null>;

  abstract findMany(
    storeId: string,
    options?: { includeInactive?: boolean },
  ): Promise<FinancialAccount[]>;

  abstract save(account: FinancialAccount): Promise<FinancialAccount>;

  abstract delete(storeId: string, id: string): Promise<void>;
}
