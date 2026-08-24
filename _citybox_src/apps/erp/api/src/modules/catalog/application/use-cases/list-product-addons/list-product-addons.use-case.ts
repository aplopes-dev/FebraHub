import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { ProductAddon } from '../../../domain/entities/product-addon.entity';
import { ProductAddonRepository } from '../../../domain/repositories/product-addon.repository.interface';
import type {
  ListProductAddonsDto,
  ListProductAddonsResult,
} from '../../dtos/product-addon.dto';

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 10;
const MAX_PER_PAGE = 100;

@Injectable()
export class ListProductAddonsUseCase implements IUseCase<
  ListProductAddonsDto,
  ListProductAddonsResult | ProductAddon[]
> {
  constructor(private readonly addonRepository: ProductAddonRepository) {}

  async execute(
    input: ListProductAddonsDto,
  ): Promise<ListProductAddonsResult | ProductAddon[]> {
    const activeOnly = input.active !== false;
    const paginated = input.page !== undefined || input.perPage !== undefined;

    if (!paginated) {
      return this.addonRepository.findAll(input.organizationId, {
        activeOnly,
        search: input.search,
      });
    }

    const perPage = Math.min(
      Math.max(input.perPage ?? DEFAULT_PER_PAGE, 1),
      MAX_PER_PAGE,
    );
    const total = await this.addonRepository.count(input.organizationId, {
      activeOnly,
      search: input.search,
    });
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const page = Math.min(Math.max(input.page ?? DEFAULT_PAGE, 1), totalPages);
    const skip = (page - 1) * perPage;

    const items = await this.addonRepository.findAll(input.organizationId, {
      activeOnly,
      search: input.search,
      skip,
      take: perPage,
    });

    return { items, total, page, perPage, totalPages };
  }
}
