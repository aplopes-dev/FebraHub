import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { CustomerCategory } from '../../../domain/entities/customer-category.entity';
import { CustomerCategoryRepository } from '../../../domain/repositories/customer-category.repository.interface';
import { CustomerCategoryNameTakenError } from '../../../domain/errors/customer-category-name-taken.error';
import type { CreateCustomerCategoryDto } from '../../dtos/customer-category.dto';

@Injectable()
export class CreateCustomerCategoryUseCase implements IUseCase<
  CreateCustomerCategoryDto,
  CustomerCategory
> {
  constructor(
    private readonly categoryRepository: CustomerCategoryRepository,
  ) {}

  async execute(input: CreateCustomerCategoryDto): Promise<CustomerCategory> {
    const name = input.name.trim();
    const existing = await this.categoryRepository.findByName(
      input.organizationId,
      name,
    );
    if (existing) throw new CustomerCategoryNameTakenError(name);

    const category = CustomerCategory.create({
      organizationId: input.organizationId,
      name,
      discountPercentage: input.discountPercentage ?? 0,
    });

    return this.categoryRepository.save(category);
  }
}
