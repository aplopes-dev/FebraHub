import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { resolvePagination } from '../../../../tenancy/application/pagination';
import { StockMovementRepository } from '../../../domain/repositories/stock-movement.repository.interface';
import type {
  ListStockMovementsDto,
  ListStockMovementsResult,
} from '../../dtos/stock-movement.dto';

@Injectable()
export class ListStockMovementsUseCase implements IUseCase<
  ListStockMovementsDto,
  ListStockMovementsResult
> {
  constructor(
    private readonly stockMovementRepository: StockMovementRepository,
  ) {}

  async execute(
    input: ListStockMovementsDto,
  ): Promise<ListStockMovementsResult> {
    const criteria = {
      tab: input.tab ?? 'all',
      search: input.search,
      reason: input.reason,
    };

    const [total, tabCounts] = await Promise.all([
      this.stockMovementRepository.count(input.organizationId, criteria),
      this.stockMovementRepository.countByTabs(input.organizationId),
    ]);

    const pagination = resolvePagination(total, input.page, input.perPage);

    const items = await this.stockMovementRepository.findAll(
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
