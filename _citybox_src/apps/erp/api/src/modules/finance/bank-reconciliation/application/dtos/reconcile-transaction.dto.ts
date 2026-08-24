import type { BankStatement } from '../../domain/entities/bank-statement.entity';
import type { BankStatementTransaction } from '../../domain/entities/bank-statement-transaction.entity';
import type { BankStatementMatch } from '../../domain/entities/bank-statement-match.entity';

export type ReconcileTransactionDto = {
  organizationId: string;
  bankStatementId: string;
  transactionId: string;
  financialEntryIds: string[];
};

export type ReconcileTransactionResult = {
  bankStatement: BankStatement;
  transaction: BankStatementTransaction;
  matches: BankStatementMatch[];
};
