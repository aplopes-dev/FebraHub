import { Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ProductEntity } from '../../../domain/entities/product.entity';
import { ProductRepository } from '../../../domain/repositories/product.repository.interface';

export interface CreateProductInput {
  storeId: string;
  name: string;
  sku?: string;
  unitOfMeasure: string;
  stockQuantity: number;
  minStockQuantity: number;
  costPrice?: number | null;
  description?: string | null;
  active?: boolean;
}

@Injectable()
export class CreateProductUseCase implements IUseCase<
  CreateProductInput,
  ProductEntity
> {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: CreateProductInput): Promise<ProductEntity> {
    const product = ProductEntity.create({
      storeId: input.storeId,
      name: input.name,
      sku: input.sku ?? '',
      unitOfMeasure: input.unitOfMeasure,
      stockQuantity: input.stockQuantity,
      minStockQuantity: input.minStockQuantity,
      costPrice: input.costPrice ?? null,
      description: input.description ?? null,
      active: input.active ?? true,
    });

    await this.productRepository.save(product);
    return product;
  }
}
