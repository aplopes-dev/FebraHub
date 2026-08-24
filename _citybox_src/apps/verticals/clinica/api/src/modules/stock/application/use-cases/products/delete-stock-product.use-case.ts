import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';

import { StockProductRepository } from '../../../domain/repositories/stock-product.repository';
import { StockProductNotFoundError } from '../../../domain/errors/stock-product-not-found.error';

export type DeleteStockProductDto = {
  storeId: string;
  productId: string;
};

@Injectable()
export class DeleteStockProductUseCase implements IUseCase<
  DeleteStockProductDto,
  void
> {
  constructor(
    private readonly repository: StockProductRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(dto: DeleteStockProductDto): Promise<void> {
    const product = await this.repository.findById(dto.storeId, dto.productId);
    if (!product) {
      throw new StockProductNotFoundError(
        DeleteStockProductUseCase.name,
        dto.productId,
      );
    }

    if (product.photoObjectKey) {
      await this.storage.delete(product.photoObjectKey);
    }

    await this.repository.delete(dto.storeId, dto.productId);
  }
}
