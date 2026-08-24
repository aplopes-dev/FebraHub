import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { Variation } from '../../../domain/entities/variation.entity';
import { VariationRepository } from '../../../domain/repositories/variation.repository.interface';
import type {
  ListVariationsDto,
  ListVariationsResult,
} from '../../dtos/variation.dto';

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 10;
const MAX_PER_PAGE = 100;

@Injectable()
export class ListVariationsUseCase implements IUseCase<
  ListVariationsDto,
  ListVariationsResult | Variation[]
> {
  constructor(private readonly variationRepository: VariationRepository) {}

  async execute(
    input: ListVariationsDto,
  ): Promise<ListVariationsResult | Variation[]> {
    const paginated = input.page !== undefined || input.perPage !== undefined;

    if (!paginated) {
      return this.variationRepository.findAll(input.organizationId, {
        search: input.search,
      });
    }

    const perPage = Math.min(
      Math.max(input.perPage ?? DEFAULT_PER_PAGE, 1),
      MAX_PER_PAGE,
    );
    const total = await this.variationRepository.count(input.organizationId, {
      search: input.search,
    });
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const page = Math.min(Math.max(input.page ?? DEFAULT_PAGE, 1), totalPages);
    const skip = (page - 1) * perPage;

    const items = await this.variationRepository.findAll(input.organizationId, {
      search: input.search,
      skip,
      take: perPage,
    });

    return { items, total, page, perPage, totalPages };
  }
}
