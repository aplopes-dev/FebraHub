import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { resolvePagination } from '../../../../../tenancy/application/pagination';
import { FinancialEntryRepository } from '../../../domain/repositories/financial-entry.repository.interface';
import { assertValidPeriodRange } from '../../../domain/validators/period-range.validator';
import type {
  ListFinancialEntriesDto,
  ListFinancialEntriesResult,
} from '../../dtos/financial-entry.dto';

@Injectable()
export class ListFinancialEntriesUseCase implements IUseCase<
  ListFinancialEntriesDto,
  ListFinancialEntriesResult
> {
  constructor(
    private readonly financialEntryRepository: FinancialEntryRepository,
  ) {}

  async execute(
    input: ListFinancialEntriesDto,
  ): Promise<ListFinancialEntriesResult> {
    assertValidPeriodRange(input.dueFrom, input.dueTo);
    assertValidPeriodRange(input.competenceFrom, input.competenceTo);

    const tab = input.tab ?? 'active';
    const criteria = {
      operation: input.operation,
      status: input.status,
      chartOfAccountId: input.chartOfAccountId,
      costCenterId: input.costCenterId,
      bankAccountId: input.bankAccountId,
      search: input.search,
      dueFrom: input.dueFrom,
      dueTo: input.dueTo,
      competenceFrom: input.competenceFrom,
      competenceTo: input.competenceTo,
      sort: input.sort,
      tab,
    };

    // Os contadores das abas ignoram busca, operação, status e período de
    // propósito (paridade com o front): eles dizem quanto existe em cada aba,
    // não quanto o filtro achou.
    const [total, tabCounts] = await Promise.all([
      this.financialEntryRepository.count(input.organizationId, criteria),
      this.financialEntryRepository.countByTabs(input.organizationId),
    ]);

    const pagination = resolvePagination(total, input.page, input.perPage);

    const items = await this.financialEntryRepository.findAll(
      input.organizationId,
      {
        ...criteria,
        skip: pagination.skip,
        take: pagination.perPage,
      },
    );

    return {
      items,
      total,
      page: pagination.page,
      perPage: pagination.perPage,
      totalPages: pagination.totalPages,
      tabCounts,
    };
  }
}
