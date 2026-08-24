import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../shared/core/use-case.interface';

import type { StockProductListCriteria } from '../../../domain/repositories/stock-product.repository';
import { StockProductRepository } from '../../../domain/repositories/stock-product.repository';

export type ListStockProductsDto = {
  storeId: string;
  search?: string;
  page?: number;
  perPage?: number;
  sortBy?: StockProductListCriteria['sortBy'];
  sortOrder?: StockProductListCriteria['sortOrder'];
};

@Injectable()
export class ListStockProductsUseCase implements IUseCase<
  ListStockProductsDto,
  ReturnType<StockProductRepository['findBySearch']>
> {
  constructor(private readonly repository: StockProductRepository) {}

  async execute(
    dto: ListStockProductsDto,
  ): Promise<ReturnType<StockProductRepository['findBySearch']>> {
    const criteria: StockProductListCriteria = {
      search: dto.search,
      page: dto.page ?? 1,
      perPage: dto.perPage ?? 20,
      sortBy: dto.sortBy,
      sortOrder: dto.sortOrder,
    };

    return this.repository.findBySearch(dto.storeId, criteria);
  }
}
