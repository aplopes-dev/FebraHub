import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';

import { StockProductRepository } from '../../../domain/repositories/stock-product.repository';
import { StockProductNotFoundError } from '../../../domain/errors/stock-product-not-found.error';
import { StockProductPhotoNotFoundError } from '../../../domain/errors/stock-product-photo-not-found.error';

export type DeleteStockProductPhotoDto = {
  storeId: string;
  productId: string;
};

@Injectable()
export class DeleteStockProductPhotoUseCase implements IUseCase<
  DeleteStockProductPhotoDto,
  void
> {
  constructor(
    private readonly repository: StockProductRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(dto: DeleteStockProductPhotoDto): Promise<void> {
    const product = await this.repository.findById(dto.storeId, dto.productId);
    if (!product) {
      throw new StockProductNotFoundError(
        DeleteStockProductPhotoUseCase.name,
        dto.productId,
      );
    }

    if (!product.photoObjectKey) {
      throw new StockProductPhotoNotFoundError(
        DeleteStockProductPhotoUseCase.name,
        dto.productId,
      );
    }

    await this.storage.delete(product.photoObjectKey);
    product.clearPhoto();
    await this.repository.save(product);
  }
}
