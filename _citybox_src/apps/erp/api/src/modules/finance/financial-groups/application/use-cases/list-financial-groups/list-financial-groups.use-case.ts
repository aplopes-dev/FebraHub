import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { resolvePagination } from '../../../../../tenancy/application/pagination';
import { FinancialGroupRepository } from '../../../domain/repositories/financial-group.repository.interface';
import type {
  ListFinancialGroupsDto,
  ListFinancialGroupsResult,
} from '../../dtos/financial-group.dto';

@Injectable()
export class ListFinancialGroupsUseCase implements IUseCase<
  ListFinancialGroupsDto,
  ListFinancialGroupsResult
> {
  constructor(private readonly groupRepository: FinancialGroupRepository) {}

  async execute(
    input: ListFinancialGroupsDto,
  ): Promise<ListFinancialGroupsResult> {
    const tab = input.tab ?? 'active';
    const criteria = { search: input.search, type: input.type, tab };

    // Os contadores das abas ignoram busca e filtro de tipo de propósito
    // (paridade com o front): eles dizem quanto existe em cada aba, não quanto
    // a busca achou.
    const [total, active, deleted] = await Promise.all([
      this.groupRepository.count(input.organizationId, criteria),
      this.groupRepository.count(input.organizationId, { tab: 'active' }),
      this.groupRepository.count(input.organizationId, { tab: 'deleted' }),
    ]);

    const pagination = resolvePagination(total, input.page, input.perPage);

    const items = await this.groupRepository.findAll(input.organizationId, {
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
