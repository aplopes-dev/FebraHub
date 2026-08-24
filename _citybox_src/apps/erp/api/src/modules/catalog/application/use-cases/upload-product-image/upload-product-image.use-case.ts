import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import type { Product } from '../../../domain/entities/product.entity';
import { ProductNotFoundError } from '../../../domain/errors/product-not-found.error';
import { ProductRepository } from '../../../domain/repositories/product.repository.interface';
import type { UploadProductImageDto } from '../../dtos/product.dto';
import { ErpObjectKeyPolicy } from '../../policies/erp-object-key.policy';
import { ImageFileValidator } from '../../validators/image-file.validator';

@Injectable()
export class UploadProductImageUseCase implements IUseCase<
  UploadProductImageDto,
  Product
> {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(dto: UploadProductImageDto): Promise<Product> {
    const mimeType = ImageFileValidator.validate(
      dto.buffer,
      dto.declaredMimeType,
    );

    const product = await this.productRepository.findById(
      dto.organizationId,
      dto.productId,
    );
    if (!product) throw new ProductNotFoundError(dto.productId);

    if (product.hasImage() && product.imageUrl) {
      await this.storage.delete(product.imageUrl);
    }

    const key = ErpObjectKeyPolicy.productImageKey(
      dto.organizationId,
      dto.productId,
      mimeType,
    );

    await this.storage.put({
      key,
      buffer: dto.buffer,
      mimeType,
    });

    product.setImage(key);
    return this.productRepository.save(product);
  }
}
