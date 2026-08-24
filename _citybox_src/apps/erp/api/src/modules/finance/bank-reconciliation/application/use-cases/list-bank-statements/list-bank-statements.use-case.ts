import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { resolvePagination } from '../../../../../tenancy/application/pagination';
import { BankStatementRepository } from '../../../domain/repositories/bank-statement.repository.interface';
import type {
  ListBankStatementsDto,
  ListBankStatementsResult,
} from '../../dtos/bank-statement.dto';

@Injectable()
export class ListBankStatementsUseCase implements IUseCase<
  ListBankStatementsDto,
  ListBankStatementsResult
> {
  constructor(
    private readonly bankStatementRepository: BankStatementRepository,
  ) {}

  async execute(
    input: ListBankStatementsDto,
  ): Promise<ListBankStatementsResult> {
    const criteria = {
      bankAccountId: input.bankAccountId,
      status: input.status,
    };

    const total = await this.bankStatementRepository.count(
      input.organizationId,
      criteria,
    );
    const pagination = resolvePagination(total, input.page, input.perPage);

    const data = await this.bankStatementRepository.findAll(
      input.organizationId,
      {
        ...criteria,
        skip: pagination.skip,
        take: pagination.perPage,
      },
    );

    return { data, total };
  }
}
