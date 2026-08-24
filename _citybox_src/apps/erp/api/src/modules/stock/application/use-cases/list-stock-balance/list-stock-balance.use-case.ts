import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { resolvePagination } from '../../../../tenancy/application/pagination';
import { StockRepository } from '../../../domain/repositories/stock.repository.interface';
import { StockMovementRepository } from '../../../domain/repositories/stock-movement.repository.interface';
import { StockNotFoundError } from '../../../domain/errors/stock-not-found.error';
import type {
  ListStockBalanceDto,
  ListStockBalanceResult,
} from '../../dtos/stock-movement.dto';

@Injectable()
export class ListStockBalanceUseCase implements IUseCase<
  ListStockBalanceDto,
  ListStockBalanceResult
> {
  constructor(
    private readonly stockRepository: StockRepository,
    private readonly stockMovementRepository: StockMovementRepository,
  ) {}

  async execute(input: ListStockBalanceDto): Promise<ListStockBalanceResult> {
    const stock = await this.stockRepository.findById(
      input.organizationId,
      input.stockId,
    );
    if (!stock) throw new StockNotFoundError(input.stockId);

    const criteria = {
      search: input.search,
      status: input.status,
    };

    const total = await this.stockMovementRepository.countBalance(
      input.organizationId,
      input.stockId,
      criteria,
    );

    const pagination = resolvePagination(total, input.page, input.perPage);

    const items = await this.stockMovementRepository.listBalance(
      input.organizationId,
      input.stockId,
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
    };
  }
}
