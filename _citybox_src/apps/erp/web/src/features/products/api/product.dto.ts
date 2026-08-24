import type { ProductListTab, ProductType } from "@/features/products/types/product";

/** Vínculo produto ↔ fornecedor — espelha `ProductSupplierLink` da API. */
export type ProductSupplierLinkDto = {
  supplierId: string;
  supplierCode: string | null;
  conversion: number;
};

export type ProductVariationOptionOverrideDto = {
  optionId: string;
  priceCents: number | null;
  barcode: string | null;
};

export type ProductVariationLinkDto = {
  variationId: string;
  optionIds: string[];
  minChoices: number;
  maxChoices: number;
  optionOverrides: ProductVariationOptionOverrideDto[];
  sortOrder: number;
};

export type ProductAddonSettingsDto = {
  minQuantity: number;
  maxQuantity: number;
  chargeFromSelectedQuantity: boolean;
  chargeFromQuantity: number;
};

export type ProductAddonLineDto = {
  addonId: string;
  maxQuantity: number;
  priceCents: number;
  sortOrder: number;
};

export type ProductSuggestionDto = {
  suggestedProductId: string;
  sortOrder: number;
};

export type ProductAddonDto = {
  id: string;
  name: string;
  defaultPriceCents: number;
  createdAt: string;
  updatedAt: string;
};

/** Shape exato devolvido pela `erp-comercio-api` — não usar direto na UI. */
export type ProductDto = {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  unitOfMeasureId: string | null;
  type: ProductType;
  /** Centavos — a UI trabalha em reais (ver product.mapper.ts). */
  basePriceCents: number;
  perishable: boolean;
  description: string;
  imageUrl: string | null;
  /** True quando há imagem no MinIO — a UI monta a URL do proxy. */
  hasImage?: boolean;
  trackStock: boolean;
  barcodes: string[];
  branchIds: string[];
  suppliers: ProductSupplierLinkDto[];
  variationFormat?: "grid" | "composite" | null;
  variations?: ProductVariationLinkDto[];
  addonSettings: ProductAddonSettingsDto;
  addonLines: ProductAddonLineDto[];
  suggestions: ProductSuggestionDto[];
  /** Default true se ausente (client antigo / cache). */
  availableOnErp?: boolean;
  availableOnPdv?: boolean;
  hasVariants: boolean;
  variantsCount: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Placeholders da API enquanto Estoque e Lista de preços não existem. */
  stock: number;
  priceLists: string[];
};

export type ProductListMetaDto = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type ProductListResponseDto = {
  data: ProductDto[];
  meta: ProductListMetaDto;
  tabCounts: Record<ProductListTab, number>;
};

export type ProductResponseDto = { data: ProductDto };

export type ProductAddonListResponseDto = { data: ProductAddonDto[] };

export type ProductCategoryDto = {
  id: string;
  name: string;
  active: boolean;
};

export type UnitOfMeasureDto = {
  id: string;
  name: string;
  abbreviation: string;
  kind: string;
  decimalPlaces: number;
  active: boolean;
};

/** Payload de criação/edição — a API aceita o mesmo shape nos dois. */
export type SaveProductPayload = {
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
  /** Unidades onde o produto opera. Vazio = nenhuma. */
  branchIds: string[];
  /** Sempre enviar a lista atual — omitir/`[]` limpa os vínculos na API. */
  suppliers: ProductSupplierLinkDto[];
  variationFormat: "grid" | "composite" | null;
  variations: ProductVariationLinkDto[];
  addonSettings: ProductAddonSettingsDto;
  addonLines: ProductAddonLineDto[];
  suggestions: ProductSuggestionDto[];
  availableOnErp: boolean;
  availableOnPdv: boolean;
};
