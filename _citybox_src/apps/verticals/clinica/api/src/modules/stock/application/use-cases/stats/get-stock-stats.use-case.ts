import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../shared/core/use-case.interface';

import { StockProductRepository } from '../../../domain/repositories/stock-product.repository';

export type GetStockStatsDto = {
  storeId: string;
};

@Injectable()
export class GetStockStatsUseCase implements IUseCase<
  GetStockStatsDto,
  Awaited<ReturnType<StockProductRepository['getStats']>>
> {
  constructor(private readonly repository: StockProductRepository) {}

  async execute(dto: GetStockStatsDto) {
    return this.repository.getStats(dto.storeId);
  }
}
