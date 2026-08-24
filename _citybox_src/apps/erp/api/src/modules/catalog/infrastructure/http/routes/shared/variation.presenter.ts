import type { Variation } from '../../../../domain/entities/variation.entity';
import type { ListVariationsResult } from '../../../../application/dtos/variation.dto';

export class VariationPresenter {
  static toHttp(variation: Variation) {
    return {
      id: variation.id,
      name: variation.name,
      productName: variation.productName,
      productNames: variation.productNames,
      calculation: {
        chooseFrom: variation.calculation.chooseFrom,
        chooseTo: variation.calculation.chooseTo,
        chargeFromSelectedQuantity:
          variation.calculation.chargeFromSelectedQuantity,
        chargeFromQuantity: variation.calculation.chargeFromQuantity,
        priceMethod: variation.calculation.priceMethod,
      },
      options: variation.options.map((option) => ({
        id: option.id,
        name: option.name,
        description: option.description,
        imageUrl: option.imageUrl,
        priceCents: option.priceCents,
        code: option.code,
        sortOrder: option.sortOrder,
      })),
      createdAt: variation.createdAt.toISOString(),
      updatedAt: variation.updatedAt.toISOString(),
    };
  }

  static toHttpSimpleList(variations: Variation[]) {
    return {
      data: variations.map((variation) => this.toHttp(variation)),
    };
  }

  static toHttpPaginatedList(result: ListVariationsResult) {
    return {
      data: result.items.map((variation) => this.toHttp(variation)),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }

  static toHttpSingle(variation: Variation) {
    return { data: this.toHttp(variation) };
  }
}
