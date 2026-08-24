export type ProductType = "simple" | "collection" | "supply";

export type ProductChannel = {
  id: string;
  name: string;
  enabled: boolean;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  imageUrl?: string;
  category: string;
  basePrice: number;
  stock: number;
  /** True quando o produto controla estoque (API). */
  trackStock: boolean;
  variantsCount: number;
  priceLists: string[];
  channels: ProductChannel[];
  type: ProductType;
  hasVariants: boolean;
  deletedAt?: string | null;
};

export type ProductListTab = "all" | "with_variants" | "supplies" | "deleted";

export type ProductStockFilter = "all" | "in_stock" | "out_of_stock";

export type ProductVariantsFilter = "all" | "with" | "without";

export type ProductListFilters = {
  types: ProductType[];
  stock: ProductStockFilter;
  variants: ProductVariantsFilter;
  categories: string[];
  channels: string[];
};

export type ProductSortOption =
  | "name_asc"
  | "name_desc"
  | "price_asc"
  | "price_desc"
  | "stock_asc"
  | "stock_desc";

export type ProductTabCounts = Record<ProductListTab, number>;

export type ProductListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type ProductListParams = {
  tab: ProductListTab;
  search: string;
  filters: ProductListFilters;
  sort: ProductSortOption;
  page: number;
  perPage: number;
};

export type ProductListResult = {
  data: Product[];
  meta: ProductListMeta;
  tabCounts: ProductTabCounts;
};
