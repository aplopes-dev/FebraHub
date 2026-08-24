import { Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ProductEntity } from '../../../domain/entities/product.entity';
import { ProductRepository } from '../../../domain/repositories/product.repository.interface';
import { ProductNotFoundError } from '../../../domain/errors/product-not-found.error';

export interface UpdateProductInput {
  storeId: string;
  id: string;
  name?: string;
  sku?: string;
  unitOfMeasure?: string;
  stockQuantity?: number;
  minStockQuantity?: number;
  costPrice?: number | null;
  description?: string | null;
  active?: boolean;
}

@Injectable()
export class UpdateProductUseCase implements IUseCase<
  UpdateProductInput,
  ProductEntity
> {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: UpdateProductInput): Promise<ProductEntity> {
    const product = await this.productRepository.findById(
      input.storeId,
      input.id,
    );
    if (!product) {
      throw new ProductNotFoundError(input.id);
    }

    product.update({
      name: input.name,
      sku: input.sku,
      unitOfMeasure: input.unitOfMeasure,
      stockQuantity: input.stockQuantity,
      minStockQuantity: input.minStockQuantity,
      costPrice: input.costPrice,
      description: input.description,
      active: input.active,
    });

    await this.productRepository.save(product);
    return product;
  }
}
