import type { Product, ProductType } from '../entities/product.entity';

/** Abas da listagem — espelham `ProductListTab` do front. */
export const PRODUCT_LIST_TABS = [
  'all',
  'with_variants',
  'supplies',
  'deleted',
] as const;

export type ProductListTab = (typeof PRODUCT_LIST_TABS)[number];

export const PRODUCT_SORT_OPTIONS = [
  'name_asc',
  'name_desc',
  'price_asc',
  'price_desc',
  'stock_asc',
  'stock_desc',
] as const;

export type ProductSortOption = (typeof PRODUCT_SORT_OPTIONS)[number];

export type ProductVariantsFilter = 'all' | 'with' | 'without';

export const PRODUCT_STOCK_FILTERS = ['in_stock', 'out_of_stock'] as const;
export type ProductStockFilter = (typeof PRODUCT_STOCK_FILTERS)[number];

export type ProductListCriteria = {
  skip?: number;
  take?: number;
  tab?: ProductListTab;
  search?: string;
  sort?: ProductSortOption;
  types?: ProductType[];
  variants?: ProductVariantsFilter;
  categoryIds?: string[];
  /** Recorta pelo vínculo com a unidade. */
  branchId?: string | null;
  /**
   * Quando true (com `branchId`), exige `ProductBranch.active = true`.
   * Usado pelo snapshot do PDV — o backoffice continua listando o vínculo
   * independentemente do flag `active`.
   */
  branchActiveOnly?: boolean;
  /** Quando true, só produtos com controle de estoque. */
  trackStock?: boolean;
  /** Filtro por saldo agregado (escopo branch/org igual ao campo `stock`). */
  stockFilter?: ProductStockFilter;
  /** Quando informado, filtra por disponibilidade no ERP. */
  availableOnErp?: boolean;
  /** Quando informado, filtra por disponibilidade no PDV. */
  availableOnPdv?: boolean;
};

export type ProductTabCounts = Record<ProductListTab, number>;

export abstract class ProductRepository {
  abstract findById(
    organizationId: string,
    id: string,
  ): Promise<Product | null>;
  abstract findBySku(
    organizationId: string,
    sku: string,
  ): Promise<Product | null>;
  abstract findAll(
    organizationId: string,
    criteria?: ProductListCriteria,
  ): Promise<Product[]>;
  abstract count(
    organizationId: string,
    criteria?: ProductListCriteria,
  ): Promise<number>;
  /** Produtos vinculados à categoria (inclui soft-deleted — checagem de exclusão). */
  abstract countByCategoryId(
    organizationId: string,
    categoryId: string,
  ): Promise<number>;
  abstract countByUnitOfMeasureId(
    organizationId: string,
    unitOfMeasureId: string,
  ): Promise<number>;
  /**
   * Contagem das abas — ignora busca e filtros de toolbar, mas respeita o
   * recorte por unidade quando `branchId` está ativo (paridade com a listagem).
   */
  abstract countByTabs(
    organizationId: string,
    branchId?: string | null,
  ): Promise<ProductTabCounts>;
  abstract save(product: Product): Promise<Product>;
  abstract softDeleteMany(
    organizationId: string,
    ids: string[],
  ): Promise<number>;
}
