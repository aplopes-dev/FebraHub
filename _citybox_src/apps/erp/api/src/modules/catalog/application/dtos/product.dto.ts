import type {
  Product,
  ProductAddonSettingsProps,
  ProductSupplierLink,
  ProductType,
  ProductVariationFormat,
  ProductVariationLink,
} from '../../domain/entities/product.entity';
import type {
  ProductListTab,
  ProductSortOption,
  ProductStockFilter,
  ProductTabCounts,
  ProductVariantsFilter,
} from '../../domain/repositories/product.repository.interface';
import type { ProductVariationInput } from '../utils/resolve-product-variations';
import type { ProductAddonLineInput } from '../utils/resolve-product-addon-lines';
import type { ProductSuggestionInput } from '../utils/resolve-product-suggestions';

export type ListProductsDto = {
  organizationId: string;
  page?: number;
  perPage?: number;
  tab?: ProductListTab;
  search?: string;
  sort?: ProductSortOption;
  types?: ProductType[];
  variants?: ProductVariantsFilter;
  categoryIds?: string[];
  /** Recorta pelo vínculo com a unidade. Ausente = catálogo da empresa inteira. */
  branchId?: string | null;
  /** Quando true, só produtos com controle de estoque. */
  trackStock?: boolean;
  /** Filtro por saldo agregado (`in_stock` | `out_of_stock`). */
  stockFilter?: ProductStockFilter;
  /** Quando informado, filtra por disponibilidade no ERP. */
  availableOnErp?: boolean;
  /** Quando informado, filtra por disponibilidade no PDV. */
  availableOnPdv?: boolean;
};

export type ListProductsResult = {
  products: Product[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  tabCounts: ProductTabCounts;
};

export type CreateProductDto = {
  organizationId: string;
  name: string;
  sku: string;
  categoryId: string;
  unitOfMeasureId: string | null;
  type: ProductType;
  basePriceCents: number;
  perishable: boolean;
  description: string;
  imageUrl: string | null;
  trackStock: boolean;
  barcodes: string[];
  availableOnErp?: boolean;
  availableOnPdv?: boolean;
  /** Unidades onde o produto opera. Omitido ou vazio = nenhuma. */
  branchIds?: string[];
  /** Fornecedores do item, com código e fator de conversão. */
  suppliers?: ProductSupplierLink[];
  variationFormat?: ProductVariationFormat | null;
  variations?: ProductVariationInput[];
  addonSettings?: ProductAddonSettingsProps;
  addonLines?: ProductAddonLineInput[];
  suggestions?: ProductSuggestionInput[];
};

export type UpdateProductDto = CreateProductDto & { id: string };

export type DuplicateProductDto = {
  organizationId: string;
  productId: string;
};

export type ImportProductsDto = {
  organizationId: string;
  /** Unidade ativa (`X-Branch-Id`) — vincula os produtos criados quando presente. */
  branchId?: string | null;
  buffer: Buffer;
};

export type ImportProductsResult = {
  created: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
};

export type UploadProductImageDto = {
  organizationId: string;
  productId: string;
  buffer: Buffer;
  declaredMimeType: string;
};

export type GetProductImageDto = {
  organizationId: string;
  productId: string;
};

export type DeleteProductImageDto = {
  organizationId: string;
  productId: string;
};

export type UploadVariationOptionImageDto = {
  organizationId: string;
  variationId: string;
  optionId: string;
  buffer: Buffer;
  declaredMimeType: string;
};

export type GetVariationOptionImageDto = {
  organizationId: string;
  variationId: string;
  optionId: string;
};

export type DeleteVariationOptionImageDto = {
  organizationId: string;
  variationId: string;
  optionId: string;
};

export type { ProductVariationFormat, ProductVariationLink };
