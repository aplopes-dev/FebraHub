import type {
  ProductionType,
  TechnicalSheet,
} from '../entities/technical-sheet.entity';

export type TechnicalSheetListTab = 'all' | 'production';

export type TechnicalSheetSort =
  | 'name_asc'
  | 'name_desc'
  | 'category_asc'
  | 'category_desc';

export type TechnicalSheetsListCriteria = {
  tab?: TechnicalSheetListTab;
  search?: string;
  /** Nome ou id da categoria. */
  category?: string;
  /** Nomes ou ids de categorias (filtro multi). */
  categories?: string[];
  productionTypes?: ProductionType[];
  sort?: TechnicalSheetSort;
  skip?: number;
  take?: number;
};

export type TechnicalSheetListRow = {
  productId: string;
  name: string;
  sku: string;
  imageUrl: string | null;
  categoryName: string;
  productionType: ProductionType | null;
  hasComposition: boolean;
};

export type TechnicalSheetTabCounts = {
  all: number;
  production: number;
};

/** Linha enriquecida para o GET detalhe (custo unitário do supply). */
export type TechnicalSheetComponentView = {
  id: string;
  componentProductId: string;
  name: string;
  unit: string;
  optional: boolean;
  quantity: string;
  unitCostCents: number;
  sortOrder: number;
};

export type TechnicalSheetOptionComponentView = {
  id: string;
  variationOptionId: string;
  componentProductId: string;
  name: string;
  unit: string;
  optional: boolean;
  quantity: string;
  unitCostCents: number;
  sortOrder: number;
};

export type TechnicalSheetDetailView = {
  productId: string;
  name: string;
  sku: string;
  imageUrl: string | null;
  categoryName: string;
  productionType: ProductionType;
  maxRemovableComponents: number;
  markupPercent: number;
  currentPriceCents: number;
  totalCostCents: number;
  hasSheet: boolean;
  components: TechnicalSheetComponentView[];
  optionComponents: TechnicalSheetOptionComponentView[];
  sheet: TechnicalSheet | null;
};

export abstract class TechnicalSheetRepository {
  abstract findByProductId(
    organizationId: string,
    productId: string,
  ): Promise<TechnicalSheet | null>;

  abstract findDetailByProductId(
    organizationId: string,
    productId: string,
  ): Promise<TechnicalSheetDetailView | null>;

  abstract list(
    organizationId: string,
    criteria?: TechnicalSheetsListCriteria,
  ): Promise<TechnicalSheetListRow[]>;

  abstract count(
    organizationId: string,
    criteria?: Omit<TechnicalSheetsListCriteria, 'skip' | 'take' | 'sort'>,
  ): Promise<number>;

  abstract countByTabs(
    organizationId: string,
  ): Promise<TechnicalSheetTabCounts>;

  abstract upsert(sheet: TechnicalSheet): Promise<TechnicalSheet>;
}
