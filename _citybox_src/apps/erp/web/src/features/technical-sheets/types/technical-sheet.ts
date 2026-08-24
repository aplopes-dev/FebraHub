export type ProductionType = "productive_process" | "automatic";

export type TechnicalSheetListItem = {
  id: string;
  name: string;
  sku: string;
  imageUrl?: string;
  category: string;
  /** Null = produto ainda sem ficha salva. */
  productionType: ProductionType | null;
  /** Se já tem composição configurada. */
  hasComposition: boolean;
};

export type TechnicalSheetListTab = "all" | "production";

export type TechnicalSheetListFilters = {
  categories: string[];
  productionTypes: ProductionType[];
};

export type TechnicalSheetSortOption =
  | "name_asc"
  | "name_desc"
  | "category_asc"
  | "category_desc";

export type TechnicalSheetTabCounts = Record<TechnicalSheetListTab, number>;

export type TechnicalSheetListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type TechnicalSheetListParams = {
  tab: TechnicalSheetListTab;
  search: string;
  category: string;
  filters: TechnicalSheetListFilters;
  sort: TechnicalSheetSortOption;
  page: number;
  perPage: number;
};

export type TechnicalSheetListResult = {
  data: TechnicalSheetListItem[];
  meta: TechnicalSheetListMeta;
  tabCounts: TechnicalSheetTabCounts;
};

/** Linha de componente/insumo dentro da composição de um produto. */
export type CompositionComponentRow = {
  id: string;
  componentId: string;
  optional: boolean;
  quantity: number;
  /** Custo unitário do componente (R$). */
  unitCost: number;
  sortOrder: number;
};

/** Custo/preço calculado a partir da composição. */
export type CostPricing = {
  /** Percentual de markup aplicado sobre o custo total. */
  markupPercent: number;
  /** Preço atual do produto (mock). */
  currentPrice: number;
};

/** Composição de uma opção de variação (ex.: "Calabresa"). */
export type VariationOptionComposition = {
  id: string;
  optionName: string;
  optionDescription?: string;
  components: CompositionComponentRow[];
};

/** Composição de uma variação inteira (ex.: "Sabor Pizza Média"). */
export type VariationComposition = {
  id: string;
  variationName: string;
  options: VariationOptionComposition[];
};

export type TechnicalSheetFormValues = {
  productionType: ProductionType;
  /** Máximo de componentes que o cliente pode remover. */
  maxRemovableComponents: number;
  components: CompositionComponentRow[];
  cost: CostPricing;
  variations: VariationComposition[];
};

export type TechnicalSheetFormTab = "product" | "variations";
