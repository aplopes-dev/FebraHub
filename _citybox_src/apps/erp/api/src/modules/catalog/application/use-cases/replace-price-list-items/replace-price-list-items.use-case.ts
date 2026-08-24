import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PriceListItem } from '../../../domain/entities/price-list-item.entity';
import { PriceListNotFoundError } from '../../../domain/errors/price-list-not-found.error';
import { PriceListProductNotFoundError } from '../../../domain/errors/price-list-product-not-found.error';
import { PriceListRepository } from '../../../domain/repositories/price-list.repository.interface';
import { ProductRepository } from '../../../domain/repositories/product.repository.interface';
import type { ReplacePriceListItemsDto } from '../../dtos/price-list.dto';

@Injectable()
export class ReplacePriceListItemsUseCase implements IUseCase<
  ReplacePriceListItemsDto,
  PriceListItem[]
> {
  constructor(
    private readonly priceListRepository: PriceListRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(input: ReplacePriceListItemsDto): Promise<PriceListItem[]> {
    const list = await this.priceListRepository.findById(
      input.organizationId,
      input.priceListId,
    );
    if (!list) throw new PriceListNotFoundError(input.priceListId);

    const uniqueProductIds = [
      ...new Set(input.items.map((item) => item.productId)),
    ];

    for (const productId of uniqueProductIds) {
      const product = await this.productRepository.findById(
        input.organizationId,
        productId,
      );
      if (!product || product.deletedAt) {
        throw new PriceListProductNotFoundError(productId);
      }
    }

    const items = uniqueProductIds.map((productId) => {
      const last = [...input.items]
        .reverse()
        .find((item) => item.productId === productId)!;
      return PriceListItem.create({
        organizationId: input.organizationId,
        priceListId: input.priceListId,
        productId,
        priceCents: last.priceCents,
      });
    });

    return this.priceListRepository.replaceItems(
      input.organizationId,
      input.priceListId,
      items,
    );
  }
}
