import type { BankTransaction } from '../../domain/entities/bank-transaction.entity';
import type { BankTransactionKind } from '../../domain/entities/bank-transaction.entity';

export type ListBankAccountTransactionsDto = {
  organizationId: string;
  bankAccountId: string;
  kind?: BankTransactionKind;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  page?: number;
  perPage?: number;
};

export type ListBankAccountTransactionsResult = {
  items: BankTransaction[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type GetBankAccountStatementDto = {
  organizationId: string;
  bankAccountId: string;
  page?: number;
  perPage?: number;
};

export type BankStatementEntry = {
  transaction: BankTransaction;
  /** Saldo da conta imediatamente após esta movimentação. */
  runningBalanceCents: number;
};

export type GetBankAccountStatementResult = {
  items: BankStatementEntry[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};
