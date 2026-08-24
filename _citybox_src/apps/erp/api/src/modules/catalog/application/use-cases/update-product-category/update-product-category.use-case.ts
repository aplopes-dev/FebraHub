import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ProductCategory } from '../../../domain/entities/product-category.entity';
import { ProductCategoryRepository } from '../../../domain/repositories/product-category.repository.interface';
import { ProductCategoryNotFoundError } from '../../../domain/errors/product-category-not-found.error';
import { ProductCategoryNameTakenError } from '../../../domain/errors/product-category-name-taken.error';
import type { UpdateProductCategoryDto } from '../../dtos/product-category.dto';

@Injectable()
export class UpdateProductCategoryUseCase implements IUseCase<
  UpdateProductCategoryDto,
  ProductCategory
> {
  constructor(private readonly categoryRepository: ProductCategoryRepository) {}

  async execute(input: UpdateProductCategoryDto): Promise<ProductCategory> {
    const category = await this.categoryRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!category) throw new ProductCategoryNotFoundError(input.id);

    const name = input.name.trim();
    const duplicate = await this.categoryRepository.findByName(
      input.organizationId,
      name,
    );
    if (duplicate && duplicate.id !== input.id) {
      throw new ProductCategoryNameTakenError(name);
    }

    const updated = category.update({ name, active: input.active });
    return this.categoryRepository.save(updated);
  }
}
