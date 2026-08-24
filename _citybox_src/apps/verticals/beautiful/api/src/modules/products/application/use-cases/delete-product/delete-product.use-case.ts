import { Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ProductRepository } from '../../../domain/repositories/product.repository.interface';
import { ProductNotFoundError } from '../../../domain/errors/product-not-found.error';

export interface DeleteProductInput {
  storeId: string;
  id: string;
}

@Injectable()
export class DeleteProductUseCase implements IUseCase<
  DeleteProductInput,
  void
> {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: DeleteProductInput): Promise<void> {
    const product = await this.productRepository.findById(
      input.storeId,
      input.id,
    );
    if (!product) {
      throw new ProductNotFoundError(input.id);
    }

    await this.productRepository.delete(input.storeId, input.id);
  }
}
