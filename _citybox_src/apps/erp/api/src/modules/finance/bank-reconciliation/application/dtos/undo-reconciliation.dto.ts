import type { BankStatement } from '../../domain/entities/bank-statement.entity';
import type { BankStatementTransaction } from '../../domain/entities/bank-statement-transaction.entity';

export type UndoReconciliationDto = {
  organizationId: string;
  bankStatementId: string;
  transactionId: string;
};

export type UndoReconciliationResult = {
  bankStatement: BankStatement;
  transaction: BankStatementTransaction;
};
