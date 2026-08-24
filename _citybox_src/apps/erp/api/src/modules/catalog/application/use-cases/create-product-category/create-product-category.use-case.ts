import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ProductCategory } from '../../../domain/entities/product-category.entity';
import { ProductCategoryRepository } from '../../../domain/repositories/product-category.repository.interface';
import { ProductCategoryNameTakenError } from '../../../domain/errors/product-category-name-taken.error';
import type { CreateProductCategoryDto } from '../../dtos/product-category.dto';

@Injectable()
export class CreateProductCategoryUseCase implements IUseCase<
  CreateProductCategoryDto,
  ProductCategory
> {
  constructor(private readonly categoryRepository: ProductCategoryRepository) {}

  async execute(input: CreateProductCategoryDto): Promise<ProductCategory> {
    const name = input.name.trim();
    const existing = await this.categoryRepository.findByName(
      input.organizationId,
      name,
    );
    if (existing) throw new ProductCategoryNameTakenError(name);

    const category = ProductCategory.create({
      organizationId: input.organizationId,
      name,
      active: input.active ?? true,
    });

    return this.categoryRepository.save(category);
  }
}
