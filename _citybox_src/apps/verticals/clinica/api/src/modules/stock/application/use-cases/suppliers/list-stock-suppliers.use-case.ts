import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../shared/core/use-case.interface';

import type { StockSupplier } from '../../../domain/entities/stock-supplier.entity';
import { StockSupplierRepository } from '../../../domain/repositories/stock-supplier.repository';

export type ListStockSuppliersDto = {
  storeId: string;
};

@Injectable()
export class ListStockSuppliersUseCase implements IUseCase<
  ListStockSuppliersDto,
  StockSupplier[]
> {
  constructor(private readonly repository: StockSupplierRepository) {}

  async execute(dto: ListStockSuppliersDto): Promise<StockSupplier[]> {
    return this.repository.listAll(dto.storeId);
  }
}
