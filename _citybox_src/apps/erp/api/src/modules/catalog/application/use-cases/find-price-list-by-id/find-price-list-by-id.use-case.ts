import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { PriceList } from '../../../domain/entities/price-list.entity';
import { PriceListNotFoundError } from '../../../domain/errors/price-list-not-found.error';
import { PriceListRepository } from '../../../domain/repositories/price-list.repository.interface';
import type { FindPriceListByIdDto } from '../../dtos/price-list.dto';

export type FindPriceListByIdResult = {
  priceList: PriceList;
  productCount: number;
};

@Injectable()
export class FindPriceListByIdUseCase implements IUseCase<
  FindPriceListByIdDto,
  FindPriceListByIdResult
> {
  constructor(private readonly priceListRepository: PriceListRepository) {}

  async execute(input: FindPriceListByIdDto): Promise<FindPriceListByIdResult> {
    const priceList = await this.priceListRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!priceList) throw new PriceListNotFoundError(input.id);

    const items = await this.priceListRepository.findItems(
      input.organizationId,
      input.id,
    );

    return { priceList, productCount: items.length };
  }
}
