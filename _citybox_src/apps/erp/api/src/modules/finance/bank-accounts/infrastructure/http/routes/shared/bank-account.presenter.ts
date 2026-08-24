import type { BankAccount } from '../../../../domain/entities/bank-account.entity';
import type {
  BankAccountWithBalance,
  ListBankAccountsResult,
} from '../../../../application/dtos/bank-account.dto';

export class BankAccountPresenter {
  static toHttp(bankAccount: BankAccount, currentBalanceCents: number) {
    return {
      id: bankAccount.id,
      name: bankAccount.name,
      bankName: bankAccount.bankName,
      bankCode: bankAccount.bankCode,
      openingBalanceCents: bankAccount.openingBalanceCents,
      currentBalanceCents,
      openedAt: bankAccount.openedAt.toISOString(),
      branchIds: bankAccount.branchIds,
      deletedAt: bankAccount.deletedAt?.toISOString() ?? null,
      createdAt: bankAccount.createdAt.toISOString(),
    };
  }

  static toHttpSingle(result: BankAccountWithBalance) {
    return {
      data: this.toHttp(result.account, result.currentBalanceCents),
    };
  }

  static toHttpList(result: ListBankAccountsResult) {
    return {
      data: result.items.map((bankAccount) =>
        this.toHttp(bankAccount, result.balances[bankAccount.id] ?? 0),
      ),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
      tabCounts: result.tabCounts,
    };
  }
}
