import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import type { Product } from '../../../domain/entities/product.entity';
import { ProductHasNoImageError } from '../../../domain/errors/product-has-no-image.error';
import { ProductNotFoundError } from '../../../domain/errors/product-not-found.error';
import { ProductRepository } from '../../../domain/repositories/product.repository.interface';
import type { DeleteProductImageDto } from '../../dtos/product.dto';

@Injectable()
export class DeleteProductImageUseCase implements IUseCase<
  DeleteProductImageDto,
  Product
> {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(dto: DeleteProductImageDto): Promise<Product> {
    const product = await this.productRepository.findById(
      dto.organizationId,
      dto.productId,
    );
    if (!product) throw new ProductNotFoundError(dto.productId);
    if (!product.hasImage() || !product.imageUrl) {
      throw new ProductHasNoImageError(dto.productId);
    }

    await this.storage.delete(product.imageUrl);
    product.clearImage();
    return this.productRepository.save(product);
  }
}
