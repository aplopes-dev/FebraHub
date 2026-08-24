import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { resolvePagination } from '../../../../tenancy/application/pagination';
import { StockRepository } from '../../../domain/repositories/stock.repository.interface';
import { StockMovementRepository } from '../../../domain/repositories/stock-movement.repository.interface';
import type { ListStocksDto, ListStocksResult } from '../../dtos/stock.dto';

@Injectable()
export class ListStocksUseCase implements IUseCase<
  ListStocksDto,
  ListStocksResult
> {
  constructor(
    private readonly stockRepository: StockRepository,
    private readonly stockMovementRepository: StockMovementRepository,
  ) {}

  async execute(input: ListStocksDto): Promise<ListStocksResult> {
    const criteria = { search: input.search };

    const total = await this.stockRepository.count(
      input.organizationId,
      criteria,
    );

    const pagination = resolvePagination(total, input.page, input.perPage);

    const items = await this.stockRepository.findAll(input.organizationId, {
      ...criteria,
      skip: pagination.skip,
      take: pagination.perPage,
    });

    const stockIdsWithMovements =
      await this.stockMovementRepository.findStockIdsWithMovementsOrBalance(
        input.organizationId,
        items.map((stock) => stock.id),
      );

    return {
      items,
      stockIdsWithMovements,
      total,
      page: pagination.page,
      perPage: pagination.perPage,
      totalPages: pagination.totalPages,
    };
  }
}
