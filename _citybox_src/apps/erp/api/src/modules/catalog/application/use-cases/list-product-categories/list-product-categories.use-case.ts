import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type {
  ListProductCategoriesDto,
  ListProductCategoriesResult,
  ProductCategoryListItem,
} from '../../dtos/product-category.dto';
import { ProductCategoryRepository } from '../../../domain/repositories/product-category.repository.interface';

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 10;
const MAX_PER_PAGE = 100;

@Injectable()
export class ListProductCategoriesUseCase implements IUseCase<
  ListProductCategoriesDto,
  ListProductCategoriesResult | ProductCategoryListItem[]
> {
  constructor(private readonly categoryRepository: ProductCategoryRepository) {}

  async execute(
    input: ListProductCategoriesDto,
  ): Promise<ListProductCategoriesResult | ProductCategoryListItem[]> {
    const paginated = input.page !== undefined || input.perPage !== undefined;

    if (!paginated) {
      const categories = await this.categoryRepository.findAll(
        input.organizationId,
        {
          activeOnly: input.activeOnly,
          search: input.search,
        },
      );
      return categories.map((category) => ({ category, productCount: 0 }));
    }

    const perPage = Math.min(
      Math.max(input.perPage ?? DEFAULT_PER_PAGE, 1),
      MAX_PER_PAGE,
    );
    const total = await this.categoryRepository.count(input.organizationId, {
      activeOnly: input.activeOnly,
      search: input.search,
    });
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const page = Math.min(Math.max(input.page ?? DEFAULT_PAGE, 1), totalPages);
    const skip = (page - 1) * perPage;

    const items = await this.categoryRepository.findAllWithProductCounts(
      input.organizationId,
      {
        activeOnly: input.activeOnly,
        search: input.search,
        skip,
        take: perPage,
      },
    );

    return { items, total, page, perPage, totalPages };
  }
}
