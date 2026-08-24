import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { StockMovementRepository } from '../../../domain/repositories/stock-movement.repository';
import type { StockMovementType } from '../../../domain/stock-types';

export type ListStockMovementsDto = {
  storeId: string;
  type?: StockMovementType;
  productId?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  perPage: number;
  sortBy?: 'product' | 'quantity' | 'withdrawnBy' | 'authorizedBy' | 'date';
  sortOrder?: 'asc' | 'desc';
};

@Injectable()
export class ListStockMovementsUseCase implements IUseCase<
  ListStockMovementsDto,
  Awaited<ReturnType<StockMovementRepository['listMovements']>>
> {
  constructor(private readonly repository: StockMovementRepository) {}

  async execute(dto: ListStockMovementsDto) {
    return this.repository.listMovements(dto.storeId, {
      type: dto.type,
      productId: dto.productId,
      startDate: dto.startDate,
      endDate: dto.endDate,
      page: dto.page,
      perPage: dto.perPage,
      sortBy: dto.sortBy,
      sortOrder: dto.sortOrder,
    });
  }
}
