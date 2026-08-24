import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { CustomerCategory } from '../../../domain/entities/customer-category.entity';
import { CustomerCategoryRepository } from '../../../domain/repositories/customer-category.repository.interface';
import { CustomerCategoryNotFoundError } from '../../../domain/errors/customer-category-not-found.error';
import { CustomerCategoryNameTakenError } from '../../../domain/errors/customer-category-name-taken.error';
import type { UpdateCustomerCategoryDto } from '../../dtos/customer-category.dto';

@Injectable()
export class UpdateCustomerCategoryUseCase implements IUseCase<
  UpdateCustomerCategoryDto,
  CustomerCategory
> {
  constructor(
    private readonly categoryRepository: CustomerCategoryRepository,
  ) {}

  async execute(input: UpdateCustomerCategoryDto): Promise<CustomerCategory> {
    const category = await this.categoryRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!category) throw new CustomerCategoryNotFoundError(input.id);

    const name = input.name.trim();
    const existing = await this.categoryRepository.findByName(
      input.organizationId,
      name,
    );
    if (existing && existing.id !== category.id) {
      throw new CustomerCategoryNameTakenError(name);
    }

    return this.categoryRepository.save(
      category.update({
        name,
        discountPercentage: input.discountPercentage,
      }),
    );
  }
}
