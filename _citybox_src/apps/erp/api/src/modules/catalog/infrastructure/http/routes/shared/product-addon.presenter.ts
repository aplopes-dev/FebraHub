import type { ProductAddon } from '../../../../domain/entities/product-addon.entity';
import type { ListProductAddonsResult } from '../../../../application/dtos/product-addon.dto';

export class ProductAddonPresenter {
  static toHttp(addon: ProductAddon) {
    return {
      id: addon.id,
      name: addon.name,
      defaultPriceCents: addon.defaultPriceCents,
      createdAt: addon.createdAt.toISOString(),
      updatedAt: addon.updatedAt.toISOString(),
    };
  }

  static toHttpSingle(addon: ProductAddon) {
    return { data: this.toHttp(addon) };
  }

  /** Seletor da aba Adicionais do produto — lista simples sem paginação. */
  static toHttpSimpleList(addons: ProductAddon[]) {
    return {
      data: addons.map((addon) => this.toHttp(addon)),
    };
  }

  static toHttpPaginatedList(result: ListProductAddonsResult) {
    return {
      data: result.items.map((addon) => this.toHttp(addon)),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }
}
