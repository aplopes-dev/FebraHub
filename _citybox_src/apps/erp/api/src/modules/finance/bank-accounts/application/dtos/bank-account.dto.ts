import type { BankAccount } from '../../domain/entities/bank-account.entity';
import type {
  BankAccountListTab,
  BankAccountTabCounts,
} from '../../domain/repositories/bank-account.repository.interface';

export type BankAccountWritableDto = {
  name: string;
  bankName?: string;
  /** Identificador estável do catálogo de bancos do frontend — FR-015. */
  bankCode?: string;
  openingBalanceCents?: number;
  openedAt: Date;
  branchIds?: string[];
};

export type CreateBankAccountDto = BankAccountWritableDto & {
  organizationId: string;
};

export type UpdateBankAccountDto = BankAccountWritableDto & {
  organizationId: string;
  id: string;
};

export type DeleteBankAccountDto = {
  organizationId: string;
  id: string;
};

export type RestoreBankAccountDto = {
  organizationId: string;
  id: string;
};

export type FindBankAccountByIdDto = {
  organizationId: string;
  id: string;
};

export type ListBankAccountsDto = {
  organizationId: string;
  search?: string;
  tab?: BankAccountListTab;
  page?: number;
  perPage?: number;
};

export type ListBankAccountsResult = {
  items: BankAccount[];
  /** Saldo atual calculado por conta (`item.id` → centavos) — FR-004, research.md D2. */
  balances: Record<string, number>;
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  tabCounts: BankAccountTabCounts;
};

/** Retorno de `FindBankAccountByIdUseCase` — o saldo não é uma prop da entidade (é derivado). */
export type BankAccountWithBalance = {
  account: BankAccount;
  currentBalanceCents: number;
};
