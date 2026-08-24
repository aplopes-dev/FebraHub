import type { BankStatementTransaction } from '../../../../domain/entities/bank-statement-transaction.entity';
import type { BankStatementMatch } from '../../../../domain/entities/bank-statement-match.entity';
import type { ListStatementTransactionsResult } from '../../../../application/dtos/bank-statement-transaction.dto';
import type { Pagination } from '../../../../../../tenancy/application/pagination';

export class BankStatementTransactionPresenter {
  static toHttp(
    transaction: BankStatementTransaction,
    matches: BankStatementMatch[] = [],
  ) {
    return {
      id: transaction.id,
      postedAt: transaction.postedAt.toISOString().slice(0, 10),
      amountCents: transaction.amountCents,
      kind: transaction.kind,
      transactionType: transaction.transactionType,
      memo: transaction.memo,
      status: transaction.status,
      matches: matches.map((match) => ({
        financialEntryId: match.financialEntryId,
        amountCents: match.amountCents,
      })),
    };
  }

  static toHttpList(
    result: ListStatementTransactionsResult,
    pagination: Pagination,
    matchesByTransactionId: Map<string, BankStatementMatch[]> = new Map(),
  ) {
    return {
      data: result.data.map((transaction) =>
        this.toHttp(
          transaction,
          matchesByTransactionId.get(transaction.id) ?? [],
        ),
      ),
      meta: {
        total: result.total,
        page: pagination.page,
        perPage: pagination.perPage,
        totalPages: pagination.totalPages,
      },
    };
  }
}
