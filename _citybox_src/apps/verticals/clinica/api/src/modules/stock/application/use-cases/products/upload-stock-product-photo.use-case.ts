import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { ImageFileValidator } from '../../../../clinic-profile/application/validators/image-file.validator';

import { StockProductRepository } from '../../../domain/repositories/stock-product.repository';
import { StockProductNotFoundError } from '../../../domain/errors/stock-product-not-found.error';
import { StockProductObjectKeyPolicy } from '../../policies/stock-product-object-key.policy';
import type { StockProduct } from '../../../domain/entities/stock-product.entity';

export type UploadStockProductPhotoDto = {
  storeId: string;
  productId: string;
  buffer: Buffer;
  declaredMimeType: string;
};

@Injectable()
export class UploadStockProductPhotoUseCase implements IUseCase<
  UploadStockProductPhotoDto,
  StockProduct
> {
  constructor(
    private readonly repository: StockProductRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(dto: UploadStockProductPhotoDto): Promise<StockProduct> {
    const product = await this.repository.findById(dto.storeId, dto.productId);
    if (!product) {
      throw new StockProductNotFoundError(
        UploadStockProductPhotoUseCase.name,
        dto.productId,
      );
    }

    const mimeType = ImageFileValidator.validate(
      dto.buffer,
      dto.declaredMimeType,
    );

    if (product.photoObjectKey) {
      await this.storage.delete(product.photoObjectKey);
    }

    const key = StockProductObjectKeyPolicy.photoKey(
      dto.storeId,
      dto.productId,
      mimeType,
    );

    await this.storage.put({ key, buffer: dto.buffer, mimeType });
    product.setPhoto(key, mimeType);
    return this.repository.save(product);
  }
}
