import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { PriceListItem } from '../../../domain/entities/price-list-item.entity';
import { PriceListNotFoundError } from '../../../domain/errors/price-list-not-found.error';
import { PriceListRepository } from '../../../domain/repositories/price-list.repository.interface';
import type { ListPriceListItemsDto } from '../../dtos/price-list.dto';

@Injectable()
export class ListPriceListItemsUseCase implements IUseCase<
  ListPriceListItemsDto,
  PriceListItem[]
> {
  constructor(private readonly priceListRepository: PriceListRepository) {}

  async execute(input: ListPriceListItemsDto): Promise<PriceListItem[]> {
    const list = await this.priceListRepository.findById(
      input.organizationId,
      input.priceListId,
    );
    if (!list) throw new PriceListNotFoundError(input.priceListId);

    return this.priceListRepository.findItems(
      input.organizationId,
      input.priceListId,
    );
  }
}
