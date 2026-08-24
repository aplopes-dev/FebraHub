import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { CustomerCategoryRepository } from '../../../domain/repositories/customer-category.repository.interface';
import { CustomerCategoryNotFoundError } from '../../../domain/errors/customer-category-not-found.error';
import type {
  CustomerCategoryListItem,
  FindCustomerCategoryByIdDto,
} from '../../dtos/customer-category.dto';

@Injectable()
export class FindCustomerCategoryByIdUseCase implements IUseCase<
  FindCustomerCategoryByIdDto,
  CustomerCategoryListItem
> {
  constructor(
    private readonly categoryRepository: CustomerCategoryRepository,
  ) {}

  async execute(
    input: FindCustomerCategoryByIdDto,
  ): Promise<CustomerCategoryListItem> {
    const category = await this.categoryRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!category) throw new CustomerCategoryNotFoundError(input.id);

    const customerCount = await this.categoryRepository.countCustomers(
      input.organizationId,
      input.id,
    );

    return { category, customerCount };
  }
}
