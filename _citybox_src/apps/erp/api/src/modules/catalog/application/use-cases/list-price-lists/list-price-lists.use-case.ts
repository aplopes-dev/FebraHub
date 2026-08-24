import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PriceListRepository } from '../../../domain/repositories/price-list.repository.interface';
import type {
  ListPriceListsDto,
  ListPriceListsResult,
} from '../../dtos/price-list.dto';

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 10;
const MAX_PER_PAGE = 100;

@Injectable()
export class ListPriceListsUseCase implements IUseCase<
  ListPriceListsDto,
  ListPriceListsResult
> {
  constructor(private readonly priceListRepository: PriceListRepository) {}

  async execute(input: ListPriceListsDto): Promise<ListPriceListsResult> {
    const perPage = Math.min(
      Math.max(input.perPage ?? DEFAULT_PER_PAGE, 1),
      MAX_PER_PAGE,
    );
    const total = await this.priceListRepository.count(input.organizationId, {
      search: input.search,
    });
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const page = Math.min(Math.max(input.page ?? DEFAULT_PAGE, 1), totalPages);
    const skip = (page - 1) * perPage;

    const items = await this.priceListRepository.findAllWithItemCounts(
      input.organizationId,
      {
        search: input.search,
        skip,
        take: perPage,
      },
    );

    return { items, total, page, perPage, totalPages };
  }
}
