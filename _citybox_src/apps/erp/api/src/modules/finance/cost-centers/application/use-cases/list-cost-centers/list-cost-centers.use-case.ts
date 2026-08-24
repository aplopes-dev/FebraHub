import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { resolvePagination } from '../../../../../tenancy/application/pagination';
import { CostCenterRepository } from '../../../domain/repositories/cost-center.repository.interface';
import type {
  ListCostCentersDto,
  ListCostCentersResult,
} from '../../dtos/cost-center.dto';

@Injectable()
export class ListCostCentersUseCase implements IUseCase<
  ListCostCentersDto,
  ListCostCentersResult
> {
  constructor(private readonly costCenterRepository: CostCenterRepository) {}

  async execute(input: ListCostCentersDto): Promise<ListCostCentersResult> {
    const tab = input.tab ?? 'active';
    const criteria = { search: input.search, tab };

    // Os contadores das abas ignoram a busca de propósito (paridade com o
    // front): eles dizem quanto existe em cada aba, não quanto a busca achou.
    const [total, tabCounts] = await Promise.all([
      this.costCenterRepository.count(input.organizationId, criteria),
      this.costCenterRepository.countByTabs(input.organizationId),
    ]);

    const pagination = resolvePagination(total, input.page, input.perPage);

    const items = await this.costCenterRepository.findAll(
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
