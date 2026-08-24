import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { StockMovementRepository } from '../../../domain/repositories/stock-movement.repository';

export type CreateStockBulkEntryDto = {
  storeId: string;
  items: Array<{ productId: string; quantity: number }>;
  notesByProductId?: Record<string, string | null>;
  authorizedById: string;
  authorizedByName: string;
};

@Injectable()
export class CreateStockBulkEntryUseCase implements IUseCase<
  CreateStockBulkEntryDto,
  void
> {
  constructor(private readonly repository: StockMovementRepository) {}

  async execute(dto: CreateStockBulkEntryDto): Promise<void> {
    await this.repository.createBulkEntry({
      storeId: dto.storeId,
      items: dto.items,
      notesByProductId: dto.notesByProductId,
      authorizedById: dto.authorizedById,
      authorizedByName: dto.authorizedByName,
    });
  }
}
