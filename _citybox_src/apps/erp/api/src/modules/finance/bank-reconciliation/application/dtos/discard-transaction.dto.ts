import type { BankStatement } from '../../domain/entities/bank-statement.entity';
import type { BankStatementTransaction } from '../../domain/entities/bank-statement-transaction.entity';

export type DiscardTransactionDto = {
  organizationId: string;
  bankStatementId: string;
  transactionId: string;
};

export type DiscardTransactionResult = {
  bankStatement: BankStatement;
  transaction: BankStatementTransaction;
};
