import type { ProductCategory } from '../../../../domain/entities/product-category.entity';
import type { UnitOfMeasure } from '../../../../domain/entities/unit-of-measure.entity';
import type {
  ListProductCategoriesResult,
  ProductCategoryListItem,
} from '../../../../application/dtos/product-category.dto';

export class ProductCategoryPresenter {
  static toHttp(category: ProductCategory, productCount = 0) {
    return {
      id: category.id,
      name: category.name,
      active: category.active,
      isSystem: category.isSystem,
      productCount,
    };
  }

  /** Dropdown / cadastros de apoio — lista simples sem paginação. */
  static toHttpSimpleList(items: ProductCategoryListItem[]) {
    return {
      data: items.map(({ category }) => ({
        id: category.id,
        name: category.name,
        active: category.active,
        isSystem: category.isSystem,
      })),
    };
  }

  /** Tela de categorias — listagem paginada com contagem de produtos. */
  static toHttpPaginatedList(result: ListProductCategoriesResult) {
    return {
      data: result.items.map(({ category, productCount }) =>
        this.toHttp(category, productCount),
      ),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }

  static toHttpSingle(category: ProductCategory, productCount = 0) {
    return { data: this.toHttp(category, productCount) };
  }
}

export class UnitOfMeasurePresenter {
  static toHttp(unit: UnitOfMeasure) {
    return {
      id: unit.id,
      name: unit.name,
      abbreviation: unit.abbreviation,
      kind: unit.kind,
      decimalPlaces: unit.decimalPlaces,
      active: unit.active,
      isSystem: unit.isSystem,
    };
  }

  /** Dropdown / cadastros de apoio — lista simples sem paginação. */
  static toHttpSimpleList(units: UnitOfMeasure[]) {
    return {
      data: units.map((unit) => this.toHttp(unit)),
    };
  }

  /** Tela de unidades de medida — listagem paginada. */
  static toHttpPaginatedList(result: {
    items: UnitOfMeasure[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  }) {
    return {
      data: result.items.map((unit) => this.toHttp(unit)),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }

  static toHttpSingle(unit: UnitOfMeasure) {
    return { data: this.toHttp(unit) };
  }
}
