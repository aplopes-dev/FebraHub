import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ProductRepository } from '../../../domain/repositories/product.repository.interface';
import { ProductNotFoundError } from '../../../domain/errors/product-not-found.error';
import type { Product } from '../../../domain/entities/product.entity';

export type FindProductByIdDto = { organizationId: string; id: string };

@Injectable()
export class FindProductByIdUseCase implements IUseCase<
  FindProductByIdDto,
  Product
> {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute({ organizationId, id }: FindProductByIdDto): Promise<Product> {
    const product = await this.productRepository.findById(organizationId, id);
    if (!product) throw new ProductNotFoundError(id);
    return product;
  }
}
