import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ProductRepository } from '../../../domain/repositories/product.repository.interface';
import { ProductNotFoundError } from '../../../domain/errors/product-not-found.error';

export type DeleteProductDto = { organizationId: string; id: string };

/** Soft-delete: o produto some das abas ativas e aparece em "Excluídos". */
@Injectable()
export class DeleteProductUseCase implements IUseCase<DeleteProductDto, void> {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute({ organizationId, id }: DeleteProductDto): Promise<void> {
    const product = await this.productRepository.findById(organizationId, id);
    if (!product) throw new ProductNotFoundError(id);

    product.softDelete();
    await this.productRepository.save(product);
  }
}
