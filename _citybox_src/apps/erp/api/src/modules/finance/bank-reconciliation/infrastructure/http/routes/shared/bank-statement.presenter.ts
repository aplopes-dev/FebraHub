import type { BankStatement } from '../../../../domain/entities/bank-statement.entity';
import type {
  ImportBankStatementResult,
  ListBankStatementsResult,
} from '../../../../application/dtos/bank-statement.dto';
import type { Pagination } from '../../../../../../tenancy/application/pagination';

export class BankStatementPresenter {
  static toHttp(bankStatement: BankStatement) {
    return {
      id: bankStatement.id,
      bankAccountId: bankStatement.bankAccountId,
      bankName: bankStatement.bankName,
      bankCode: bankStatement.bankCode,
      branchNumber: bankStatement.branchNumber,
      accountNumber: bankStatement.accountNumber,
      periodStart: bankStatement.periodStart.toISOString().slice(0, 10),
      periodEnd: bankStatement.periodEnd.toISOString().slice(0, 10),
      status: bankStatement.status,
      counts: {
        pending: bankStatement.pendingCount,
        reconciled: bankStatement.reconciledCount,
        discarded: bankStatement.discardedCount,
      },
      fileName: bankStatement.fileName,
      createdAt: bankStatement.createdAt.toISOString(),
    };
  }

  static toHttpSingle(bankStatement: BankStatement) {
    return { data: this.toHttp(bankStatement) };
  }

  static toHttpImport(result: ImportBankStatementResult) {
    return {
      data: this.toHttp(result.bankStatement),
      meta: result.summary,
    };
  }

  static toHttpList(result: ListBankStatementsResult, pagination: Pagination) {
    return {
      data: result.data.map((bankStatement) => this.toHttp(bankStatement)),
      meta: {
        total: result.total,
        page: pagination.page,
        perPage: pagination.perPage,
        totalPages: pagination.totalPages,
      },
    };
  }
}
