import type { ProductFiscal } from '../entities/product-fiscal.entity';

export type FiscalParameterTab = 'all' | 'pending';
export type FiscalParameterStatus = 'configured' | 'pending';
export type FiscalParameterSort =
  | 'name_asc'
  | 'name_desc'
  | 'category_asc'
  | 'category_desc';

export type FiscalParametersListCriteria = {
  tab?: FiscalParameterTab;
  search?: string;
  /** Nome ou id da categoria. */
  category?: string;
  /** Nomes ou ids de categorias (filtro multi). */
  categories?: string[];
  statuses?: FiscalParameterStatus[];
  sort?: FiscalParameterSort;
  skip?: number;
  take?: number;
};

export type FiscalParameterListRow = {
  productId: string;
  name: string;
  sku: string;
  imageUrl: string | null;
  categoryName: string;
  configured: boolean;
};

export type FiscalParameterTabCounts = {
  all: number;
  pending: number;
};

export abstract class ProductFiscalRepository {
  abstract findByProductId(
    organizationId: string,
    productId: string,
  ): Promise<ProductFiscal | null>;

  abstract list(
    organizationId: string,
    criteria?: FiscalParametersListCriteria,
  ): Promise<FiscalParameterListRow[]>;

  abstract count(
    organizationId: string,
    criteria?: Omit<FiscalParametersListCriteria, 'skip' | 'take' | 'sort'>,
  ): Promise<number>;

  abstract countByTabs(
    organizationId: string,
  ): Promise<FiscalParameterTabCounts>;

  abstract upsert(fiscal: ProductFiscal): Promise<ProductFiscal>;
}
