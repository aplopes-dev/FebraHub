import type { BankStatementTransaction } from '../../domain/entities/bank-statement-transaction.entity';
import type { BankStatementTransactionStatus } from '../../domain/entities/bank-statement-transaction.entity';

export type ListStatementTransactionsDto = {
  organizationId: string;
  bankStatementId: string;
  status: BankStatementTransactionStatus;
  search?: string;
  /** FR-035/research.md D15 — filtra por `postedAt`. */
  postedFrom?: Date;
  postedTo?: Date;
  page: number;
  perPage: number;
};

export type ListStatementTransactionsResult = {
  data: BankStatementTransaction[];
  total: number;
};
