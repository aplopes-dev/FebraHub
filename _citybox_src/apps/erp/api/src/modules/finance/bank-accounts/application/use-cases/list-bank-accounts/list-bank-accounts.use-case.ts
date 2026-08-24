import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { resolvePagination } from '../../../../../tenancy/application/pagination';
import { BankAccountRepository } from '../../../domain/repositories/bank-account.repository.interface';
import { BankTransactionRepository } from '../../../domain/repositories/bank-transaction.repository.interface';
import type {
  ListBankAccountsDto,
  ListBankAccountsResult,
} from '../../dtos/bank-account.dto';

@Injectable()
export class ListBankAccountsUseCase implements IUseCase<
  ListBankAccountsDto,
  ListBankAccountsResult
> {
  constructor(
    private readonly bankAccountRepository: BankAccountRepository,
    private readonly bankTransactionRepository: BankTransactionRepository,
  ) {}

  async execute(input: ListBankAccountsDto): Promise<ListBankAccountsResult> {
    const tab = input.tab ?? 'active';
    const criteria = { search: input.search, tab };

    // Os contadores das abas ignoram a busca de propósito (paridade com o
    // front): eles dizem quanto existe em cada aba, não quanto a busca achou.
    const [total, tabCounts] = await Promise.all([
      this.bankAccountRepository.count(input.organizationId, criteria),
      this.bankAccountRepository.countByTabs(input.organizationId),
    ]);

    const pagination = resolvePagination(total, input.page, input.perPage);

    const items = await this.bankAccountRepository.findAll(
      input.organizationId,
      {
        ...criteria,
        skip: pagination.skip,
        take: pagination.perPage,
      },
    );

    // Saldo calculado (FR-004) — nunca `openingBalanceCents` estático.
    const balances =
      await this.bankTransactionRepository.sumBalancesByAccountIds(
        input.organizationId,
        items.map((item) => item.id),
      );

    return {
      items,
      balances,
      total,
      page: pagination.page,
      perPage: pagination.perPage,
      totalPages: pagination.totalPages,
      tabCounts,
    };
  }
}
