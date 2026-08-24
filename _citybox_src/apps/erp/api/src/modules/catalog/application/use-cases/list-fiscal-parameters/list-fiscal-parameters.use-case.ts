import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ProductFiscalRepository } from '../../../domain/repositories/product-fiscal.repository.interface';
import type {
  ListFiscalParametersDto,
  ListFiscalParametersResult,
} from '../../dtos/product-fiscal.dto';

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 10;
const MAX_PER_PAGE = 100;

@Injectable()
export class ListFiscalParametersUseCase implements IUseCase<
  ListFiscalParametersDto,
  ListFiscalParametersResult
> {
  constructor(
    private readonly productFiscalRepository: ProductFiscalRepository,
  ) {}

  async execute(
    input: ListFiscalParametersDto,
  ): Promise<ListFiscalParametersResult> {
    const perPage = Math.min(
      Math.max(input.perPage ?? DEFAULT_PER_PAGE, 1),
      MAX_PER_PAGE,
    );
    const criteria = {
      tab: input.tab ?? 'all',
      search: input.search?.trim() || undefined,
      category: input.category?.trim() || undefined,
      categories: input.categories?.length ? input.categories : undefined,
      statuses: input.statuses?.length ? input.statuses : undefined,
      sort: input.sort ?? 'name_asc',
    };

    const [total, tabCounts] = await Promise.all([
      this.productFiscalRepository.count(input.organizationId, criteria),
      this.productFiscalRepository.countByTabs(input.organizationId),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const page = Math.min(Math.max(input.page ?? DEFAULT_PAGE, 1), totalPages);

    const items = await this.productFiscalRepository.list(
      input.organizationId,
      {
        ...criteria,
        skip: (page - 1) * perPage,
        take: perPage,
      },
    );

    return { items, total, page, perPage, totalPages, tabCounts };
  }
}
