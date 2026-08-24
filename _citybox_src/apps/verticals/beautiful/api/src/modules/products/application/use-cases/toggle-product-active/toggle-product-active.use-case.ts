import { Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ProductEntity } from '../../../domain/entities/product.entity';
import { ProductRepository } from '../../../domain/repositories/product.repository.interface';
import { ProductNotFoundError } from '../../../domain/errors/product-not-found.error';

export interface ToggleProductActiveInput {
  storeId: string;
  id: string;
}

@Injectable()
export class ToggleProductActiveUseCase implements IUseCase<
  ToggleProductActiveInput,
  ProductEntity
> {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: ToggleProductActiveInput): Promise<ProductEntity> {
    const product = await this.productRepository.findById(
      input.storeId,
      input.id,
    );
    if (!product) {
      throw new ProductNotFoundError(input.id);
    }

    product.toggleActive();
    await this.productRepository.save(product);
    return product;
  }
}
