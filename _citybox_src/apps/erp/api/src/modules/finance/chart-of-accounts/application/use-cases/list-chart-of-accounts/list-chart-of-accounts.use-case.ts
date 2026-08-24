import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { resolvePagination } from '../../../../../tenancy/application/pagination';
import { ChartOfAccountRepository } from '../../../domain/repositories/chart-of-account.repository.interface';
import type {
  ListChartOfAccountsDto,
  ListChartOfAccountsResult,
} from '../../dtos/chart-of-account.dto';

@Injectable()
export class ListChartOfAccountsUseCase implements IUseCase<
  ListChartOfAccountsDto,
  ListChartOfAccountsResult
> {
  constructor(private readonly accountRepository: ChartOfAccountRepository) {}

  async execute(
    input: ListChartOfAccountsDto,
  ): Promise<ListChartOfAccountsResult> {
    const tab = input.tab ?? 'active';
    const criteria = { search: input.search, tab };

    // Os contadores das abas ignoram a busca de propósito (paridade com o
    // front): eles dizem quanto existe em cada aba, não quanto a busca achou.
    const [total, active, deleted] = await Promise.all([
      this.accountRepository.count(input.organizationId, criteria),
      this.accountRepository.count(input.organizationId, { tab: 'active' }),
      this.accountRepository.count(input.organizationId, { tab: 'deleted' }),
    ]);

    const pagination = resolvePagination(total, input.page, input.perPage);

    const items = await this.accountRepository.findAll(input.organizationId, {
      ...criteria,
      skip: pagination.skip,
      take: pagination.perPage,
    });

    return {
      items,
      total,
      page: pagination.page,
      perPage: pagination.perPage,
      totalPages: pagination.totalPages,
      tabCounts: { active, deleted },
    };
  }
}
