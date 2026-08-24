import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { resolvePagination } from '../../../../../tenancy/application/pagination';
import { BankStatementRepository } from '../../../domain/repositories/bank-statement.repository.interface';
import { BankStatementTransactionRepository } from '../../../domain/repositories/bank-statement-transaction.repository.interface';
import { BankStatementNotFoundError } from '../../../domain/errors/bank-statement-not-found.error';
import type {
  ListStatementTransactionsDto,
  ListStatementTransactionsResult,
} from '../../dtos/bank-statement-transaction.dto';

@Injectable()
export class ListStatementTransactionsUseCase implements IUseCase<
  ListStatementTransactionsDto,
  ListStatementTransactionsResult
> {
  constructor(
    private readonly bankStatementRepository: BankStatementRepository,
    private readonly bankStatementTransactionRepository: BankStatementTransactionRepository,
  ) {}

  async execute(
    input: ListStatementTransactionsDto,
  ): Promise<ListStatementTransactionsResult> {
    const bankStatement = await this.bankStatementRepository.findById(
      input.organizationId,
      input.bankStatementId,
    );
    if (!bankStatement) {
      throw new BankStatementNotFoundError(input.bankStatementId);
    }

    const criteria = {
      status: input.status,
      search: input.search,
      postedFrom: input.postedFrom,
      postedTo: input.postedTo,
    };
    const total = await this.bankStatementTransactionRepository.count(
      input.organizationId,
      input.bankStatementId,
      criteria,
    );
    const pagination = resolvePagination(total, input.page, input.perPage);

    const data = await this.bankStatementTransactionRepository.findByStatement(
      input.organizationId,
      input.bankStatementId,
      { ...criteria, skip: pagination.skip, take: pagination.perPage },
    );

    return { data, total };
  }
}
