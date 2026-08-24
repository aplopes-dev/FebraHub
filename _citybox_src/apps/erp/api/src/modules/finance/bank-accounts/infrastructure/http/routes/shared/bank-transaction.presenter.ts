import type { BankTransaction } from '../../../../domain/entities/bank-transaction.entity';
import type {
  GetBankAccountStatementResult,
  ListBankAccountTransactionsResult,
} from '../../../../application/dtos/bank-transaction.dto';

/** Reaproveitado por `list-bank-account-transactions` (US3) e `get-bank-account-statement` (US2). */
export class BankTransactionPresenter {
  static toHttp(transaction: BankTransaction) {
    return {
      id: transaction.id,
      kind: transaction.kind,
      description: transaction.description,
      amountCents: transaction.amountCents,
      effectiveAt: transaction.effectiveAt.toISOString().slice(0, 10),
      sourceType: transaction.sourceType,
      createdByName: transaction.createdByName,
      createdAt: transaction.createdAt.toISOString(),
    };
  }

  static toHttpTransactionList(result: ListBankAccountTransactionsResult) {
    return {
      data: result.items.map((transaction) => this.toHttp(transaction)),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }

  static toHttpStatementList(result: GetBankAccountStatementResult) {
    return {
      data: result.items.map((entry) => ({
        transaction: this.toHttp(entry.transaction),
        runningBalanceCents: entry.runningBalanceCents,
      })),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }
}
