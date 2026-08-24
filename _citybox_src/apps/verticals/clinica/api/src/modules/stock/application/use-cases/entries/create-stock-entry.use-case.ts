import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { StockMovementRepository } from '../../../domain/repositories/stock-movement.repository';

export type CreateStockEntryDto = {
  storeId: string;
  productId: string;
  quantity: number;
  notes: string | null;
  authorizedById: string;
  authorizedByName: string;
};

@Injectable()
export class CreateStockEntryUseCase implements IUseCase<
  CreateStockEntryDto,
  void
> {
  constructor(private readonly repository: StockMovementRepository) {}

  async execute(dto: CreateStockEntryDto): Promise<void> {
    await this.repository.createEntry({
      storeId: dto.storeId,
      productId: dto.productId,
      quantity: dto.quantity,
      notes: dto.notes,
      authorizedById: dto.authorizedById,
      authorizedByName: dto.authorizedByName,
    });
  }
}
