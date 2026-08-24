import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { StockMovementRepository } from '../../../domain/repositories/stock-movement.repository';

export type CreateStockWithdrawalDto = {
  storeId: string;
  productId: string;
  quantity: number;
  requestedById: string | null;
  requestedByName: string | null;
  notes: string | null;
  authorizedById: string;
  authorizedByName: string;
};

@Injectable()
export class CreateStockWithdrawalUseCase implements IUseCase<
  CreateStockWithdrawalDto,
  void
> {
  constructor(private readonly repository: StockMovementRepository) {}

  async execute(dto: CreateStockWithdrawalDto): Promise<void> {
    await this.repository.createWithdrawal({
      storeId: dto.storeId,
      productId: dto.productId,
      quantity: dto.quantity,
      requestedById: dto.requestedById,
      requestedByName: dto.requestedByName,
      notes: dto.notes,
      authorizedById: dto.authorizedById,
      authorizedByName: dto.authorizedByName,
    });
  }
}
