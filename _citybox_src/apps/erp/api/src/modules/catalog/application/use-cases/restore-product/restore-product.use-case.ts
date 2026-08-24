import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { Product } from '../../../domain/entities/product.entity';
import { ProductRepository } from '../../../domain/repositories/product.repository.interface';
import { ProductNotFoundError } from '../../../domain/errors/product-not-found.error';

export type RestoreProductDto = { organizationId: string; id: string };

@Injectable()
export class RestoreProductUseCase implements IUseCase<
  RestoreProductDto,
  Product
> {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute({ organizationId, id }: RestoreProductDto): Promise<Product> {
    const product = await this.productRepository.findById(organizationId, id);
    if (!product) throw new ProductNotFoundError(id);

    product.restore();
    return this.productRepository.save(product);
  }
}
