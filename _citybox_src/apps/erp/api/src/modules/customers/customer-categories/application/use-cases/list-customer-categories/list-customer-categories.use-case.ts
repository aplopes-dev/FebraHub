import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { resolvePagination } from '../../../../../tenancy/application/pagination';
import { CustomerCategoryRepository } from '../../../domain/repositories/customer-category.repository.interface';
import type {
  ListCustomerCategoriesDto,
  ListCustomerCategoriesResult,
} from '../../dtos/customer-category.dto';

@Injectable()
export class ListCustomerCategoriesUseCase implements IUseCase<
  ListCustomerCategoriesDto,
  ListCustomerCategoriesResult
> {
  constructor(
    private readonly categoryRepository: CustomerCategoryRepository,
  ) {}

  async execute(
    input: ListCustomerCategoriesDto,
  ): Promise<ListCustomerCategoriesResult> {
    const criteria = { search: input.search };
    const total = await this.categoryRepository.count(
      input.organizationId,
      criteria,
    );
    const pagination = resolvePagination(total, input.page, input.perPage);
    const items = await this.categoryRepository.findAllWithCustomerCounts(
      input.organizationId,
      {
        ...criteria,
        skip: pagination.skip,
        take: pagination.perPage,
      },
    );

    return {
      items,
      total,
      page: pagination.page,
      perPage: pagination.perPage,
      totalPages: pagination.totalPages,
    };
  }
}
