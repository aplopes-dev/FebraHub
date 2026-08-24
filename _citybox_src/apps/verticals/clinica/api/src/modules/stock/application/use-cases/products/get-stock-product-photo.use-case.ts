import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';

import { StockProductRepository } from '../../../domain/repositories/stock-product.repository';
import { StockProductNotFoundError } from '../../../domain/errors/stock-product-not-found.error';
import { StockProductPhotoNotFoundError } from '../../../domain/errors/stock-product-photo-not-found.error';

export type GetStockProductPhotoDto = {
  storeId: string;
  productId: string;
};

export type GetStockProductPhotoDetail = {
  buffer: Buffer;
  mimeType: string;
};

@Injectable()
export class GetStockProductPhotoUseCase implements IUseCase<
  GetStockProductPhotoDto,
  GetStockProductPhotoDetail
> {
  constructor(
    private readonly repository: StockProductRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(
    dto: GetStockProductPhotoDto,
  ): Promise<GetStockProductPhotoDetail> {
    const product = await this.repository.findById(dto.storeId, dto.productId);
    if (!product) {
      throw new StockProductNotFoundError(
        GetStockProductPhotoUseCase.name,
        dto.productId,
      );
    }

    if (!product.photoObjectKey) {
      throw new StockProductPhotoNotFoundError(
        GetStockProductPhotoUseCase.name,
        dto.productId,
      );
    }

    const stored = await this.storage.get(product.photoObjectKey);
    return { buffer: stored.buffer, mimeType: stored.mimeType };
  }
}
