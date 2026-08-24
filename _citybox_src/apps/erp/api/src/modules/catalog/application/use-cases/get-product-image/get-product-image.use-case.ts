import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { ProductHasNoImageError } from '../../../domain/errors/product-has-no-image.error';
import { ProductNotFoundError } from '../../../domain/errors/product-not-found.error';
import { ProductRepository } from '../../../domain/repositories/product.repository.interface';
import type { GetProductImageDto } from '../../dtos/product.dto';

export type GetProductImageResult = {
  buffer: Buffer;
  mimeType: string;
};

@Injectable()
export class GetProductImageUseCase implements IUseCase<
  GetProductImageDto,
  GetProductImageResult
> {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(dto: GetProductImageDto): Promise<GetProductImageResult> {
    const product = await this.productRepository.findById(
      dto.organizationId,
      dto.productId,
    );
    if (!product) throw new ProductNotFoundError(dto.productId);
    if (!product.hasImage() || !product.imageUrl) {
      throw new ProductHasNoImageError(dto.productId);
    }

    const stored = await this.storage.get(product.imageUrl);
    return { buffer: stored.buffer, mimeType: stored.mimeType };
  }
}
