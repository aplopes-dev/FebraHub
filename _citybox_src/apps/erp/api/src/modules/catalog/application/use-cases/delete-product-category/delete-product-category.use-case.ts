import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ProductCategoryRepository } from '../../../domain/repositories/product-category.repository.interface';
import { ProductRepository } from '../../../domain/repositories/product.repository.interface';
import { ProductCategoryNotFoundError } from '../../../domain/errors/product-category-not-found.error';
import { ProductCategoryInUseError } from '../../../domain/errors/product-category-in-use.error';
import { ProductCategoryNotRemovableError } from '../../../domain/errors/product-category-not-removable.error';
import type { DeleteProductCategoryDto } from '../../dtos/product-category.dto';

@Injectable()
export class DeleteProductCategoryUseCase implements IUseCase<
  DeleteProductCategoryDto,
  void
> {
  constructor(
    private readonly categoryRepository: ProductCategoryRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  async execute({
    organizationId,
    id,
  }: DeleteProductCategoryDto): Promise<void> {
    const category = await this.categoryRepository.findById(organizationId, id);
    if (!category) throw new ProductCategoryNotFoundError(id);

    if (category.isSystem) throw new ProductCategoryNotRemovableError(id);

    const productCount = await this.productRepository.countByCategoryId(
      organizationId,
      id,
    );
    if (productCount > 0) {
      throw new ProductCategoryInUseError(category.name, productCount);
    }

    await this.categoryRepository.delete(organizationId, id);
  }
}
