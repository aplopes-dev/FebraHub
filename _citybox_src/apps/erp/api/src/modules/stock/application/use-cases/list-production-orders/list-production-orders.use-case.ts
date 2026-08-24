import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { resolvePagination } from '../../../../tenancy/application/pagination';
import { ProductionOrderRepository } from '../../../domain/repositories/production-order.repository.interface';
import type {
  ListProductionOrdersDto,
  ListProductionOrdersResult,
} from '../../dtos/production-order.dto';

@Injectable()
export class ListProductionOrdersUseCase implements IUseCase<
  ListProductionOrdersDto,
  ListProductionOrdersResult
> {
  constructor(
    private readonly productionOrderRepository: ProductionOrderRepository,
  ) {}

  async execute(
    input: ListProductionOrdersDto,
  ): Promise<ListProductionOrdersResult> {
    const criteria = {
      tab: input.tab,
      search: input.search,
    };

    // Os contadores das abas ignoram a busca de propósito — dizem quanto
    // existe em cada aba, não quanto a busca achou.
    const [total, tabCounts] = await Promise.all([
      this.productionOrderRepository.count(input.organizationId, criteria),
      this.productionOrderRepository.countByTabs(input.organizationId),
    ]);

    const pagination = resolvePagination(total, input.page, input.perPage);

    const items = await this.productionOrderRepository.findAll(
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
