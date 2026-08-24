import type {
  ProductionType,
  TechnicalSheet,
  TechnicalSheetComponentLine,
  TechnicalSheetOptionComponentLine,
} from '../../domain/entities/technical-sheet.entity';
import type {
  TechnicalSheetDetailView,
  TechnicalSheetListRow,
  TechnicalSheetListTab,
  TechnicalSheetSort,
  TechnicalSheetTabCounts,
} from '../../domain/repositories/technical-sheet.repository.interface';

export type ListTechnicalSheetsDto = {
  organizationId: string;
  page?: number;
  perPage?: number;
  tab?: TechnicalSheetListTab;
  search?: string;
  category?: string;
  categories?: string[];
  productionTypes?: ProductionType[];
  sort?: TechnicalSheetSort;
};

export type ListTechnicalSheetsResult = {
  items: TechnicalSheetListRow[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  tabCounts: TechnicalSheetTabCounts;
};

export type FindTechnicalSheetByProductIdDto = {
  organizationId: string;
  productId: string;
};

export type UpsertTechnicalSheetComponentInput = Omit<
  TechnicalSheetComponentLine,
  'id'
> & { id?: string };

export type UpsertTechnicalSheetOptionComponentInput = Omit<
  TechnicalSheetOptionComponentLine,
  'id'
> & { id?: string };

export type UpsertTechnicalSheetDto = {
  organizationId: string;
  productId: string;
  productionType: ProductionType;
  maxRemovableComponents: number;
  markupPercent: number;
  components: UpsertTechnicalSheetComponentInput[];
  optionComponents: UpsertTechnicalSheetOptionComponentInput[];
  /** Quando definido, atualiza Product.basePriceCents do produto acabado. */
  applyBasePriceCents?: number;
};

export type UpsertTechnicalSheetResult = {
  sheet: TechnicalSheet;
  detail: TechnicalSheetDetailView;
};
