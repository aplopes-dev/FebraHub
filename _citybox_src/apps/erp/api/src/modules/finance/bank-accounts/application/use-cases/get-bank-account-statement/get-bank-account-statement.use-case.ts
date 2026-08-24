import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { resolvePagination } from '../../../../../tenancy/application/pagination';
import { BankAccountRepository } from '../../../domain/repositories/bank-account.repository.interface';
import { BankTransactionRepository } from '../../../domain/repositories/bank-transaction.repository.interface';
import { BankAccountNotFoundError } from '../../../domain/errors/bank-account-not-found.error';
import type {
  GetBankAccountStatementDto,
  GetBankAccountStatementResult,
} from '../../dtos/bank-transaction.dto';

@Injectable()
export class GetBankAccountStatementUseCase implements IUseCase<
  GetBankAccountStatementDto,
  GetBankAccountStatementResult
> {
  constructor(
    private readonly bankAccountRepository: BankAccountRepository,
    private readonly bankTransactionRepository: BankTransactionRepository,
  ) {}

  /**
   * Saldo acumulado correto entre páginas sem reagregar do zero por página:
   * busca as `skip + take` movimentações mais recentes, caminha do saldo
   * total da conta para baixo, e só então recorta a página pedida — ver
   * `specs/erp/002-bank-account-ledger/research.md` D3.
   */
  async execute(
    input: GetBankAccountStatementDto,
  ): Promise<GetBankAccountStatementResult> {
    const account = await this.bankAccountRepository.findById(
      input.organizationId,
      input.bankAccountId,
    );
    if (!account) throw new BankAccountNotFoundError(input.bankAccountId);

    const total = await this.bankTransactionRepository.countByAccount(
      input.organizationId,
      input.bankAccountId,
    );
    const pagination = resolvePagination(total, input.page, input.perPage);

    if (total === 0) {
      return {
        items: [],
        total,
        page: pagination.page,
        perPage: pagination.perPage,
        totalPages: pagination.totalPages,
      };
    }

    const balances =
      await this.bankTransactionRepository.sumBalancesByAccountIds(
        input.organizationId,
        [input.bankAccountId],
      );
    const totalBalanceCents = balances[input.bankAccountId] ?? 0;

    const throughLimit = pagination.skip + pagination.perPage;
    const rows = await this.bankTransactionRepository.findOrderedThrough(
      input.organizationId,
      input.bankAccountId,
      throughLimit,
    );

    let runningBalance = totalBalanceCents;
    const withRunningBalance = rows.map((transaction) => {
      const entry = { transaction, runningBalanceCents: runningBalance };
      runningBalance -= transaction.signedAmountCents;
      return entry;
    });

    return {
      items: withRunningBalance.slice(
        pagination.skip,
        pagination.skip + pagination.perPage,
      ),
      total,
      page: pagination.page,
      perPage: pagination.perPage,
      totalPages: pagination.totalPages,
    };
  }
}
