import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { resolvePagination } from '../../../../../tenancy/application/pagination';
import { BankAccountRepository } from '../../../domain/repositories/bank-account.repository.interface';
import { BankTransactionRepository } from '../../../domain/repositories/bank-transaction.repository.interface';
import { BankAccountNotFoundError } from '../../../domain/errors/bank-account-not-found.error';
import type {
  ListBankAccountTransactionsDto,
  ListBankAccountTransactionsResult,
} from '../../dtos/bank-transaction.dto';

@Injectable()
export class ListBankAccountTransactionsUseCase implements IUseCase<
  ListBankAccountTransactionsDto,
  ListBankAccountTransactionsResult
> {
  constructor(
    private readonly bankAccountRepository: BankAccountRepository,
    private readonly bankTransactionRepository: BankTransactionRepository,
  ) {}

  async execute(
    input: ListBankAccountTransactionsDto,
  ): Promise<ListBankAccountTransactionsResult> {
    const account = await this.bankAccountRepository.findById(
      input.organizationId,
      input.bankAccountId,
    );
    if (!account) throw new BankAccountNotFoundError(input.bankAccountId);

    const criteria = {
      kind: input.kind,
      effectiveFrom: input.effectiveFrom,
      effectiveTo: input.effectiveTo,
    };

    const total = await this.bankTransactionRepository.countByAccount(
      input.organizationId,
      input.bankAccountId,
      criteria,
    );
    const pagination = resolvePagination(total, input.page, input.perPage);

    const items = await this.bankTransactionRepository.findByAccount(
      input.organizationId,
      input.bankAccountId,
      { ...criteria, skip: pagination.skip, take: pagination.perPage },
    );

    return {
      items,
      total,
      page: pagination.page,
      perPage: pagination.perPage,
      totalPages: pagination.totalPages,
    };
  }
}
