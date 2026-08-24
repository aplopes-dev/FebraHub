import type { FinancialAccount } from '../../domain/entities/financial-account.entity';

export type ListFinancialAccountsDto = {
  storeId: string;
  includeInactive?: boolean;
};

export type CreateFinancialAccountDto = {
  storeId: string;
  name: string;
  type?: string;
};

export type UpdateFinancialAccountDto = {
  storeId: string;
  accountId: string;
  name?: string;
  type?: string;
  isActive?: boolean;
};

export type DeleteFinancialAccountDto = {
  storeId: string;
  accountId: string;
};

export type ListFinancialAccountsResult = {
  items: FinancialAccount[];
};
