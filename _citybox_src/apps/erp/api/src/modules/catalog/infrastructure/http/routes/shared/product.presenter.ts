import type { Product } from '../../../../domain/entities/product.entity';
import type { ProductTabCounts } from '../../../../domain/repositories/product.repository.interface';

export type ProductResponse = {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  unitOfMeasureId: string | null;
  type: string;
  basePriceCents: number;
  perishable: boolean;
  description: string;
  /**
   * Sempre `null` na response — a object key do MinIO não é URL pública.
   * Use `hasImage` + `GET /v1/products/:id/image` (via proxy) para exibir.
   */
  imageUrl: null;
  /** True quando há object key gravada (imagem no MinIO). */
  hasImage: boolean;
  trackStock: boolean;
  barcodes: string[];
  availableOnErp: boolean;
  availableOnPdv: boolean;
  /** Unidades onde o produto opera. */
  branchIds: string[];
  /** Fornecedores do item. */
  suppliers: Array<{
    supplierId: string;
    supplierCode: string | null;
    conversion: number;
  }>;
  variationFormat: 'grid' | 'composite' | null;
  variations: Array<{
    variationId: string;
    optionIds: string[];
    minChoices: number;
    maxChoices: number;
    optionOverrides: Array<{
      optionId: string;
      priceCents: number | null;
      barcode: string | null;
    }>;
    sortOrder: number;
  }>;
  hasVariants: boolean;
  variantsCount: number;
  /** Configuração de adicionais — nunca `null`; ausência = defaults do form. */
  addonSettings: {
    minQuantity: number;
    maxQuantity: number;
    chargeFromSelectedQuantity: boolean;
    chargeFromQuantity: number;
  };
  /** Linhas de adicional ativas (adicional excluído some daqui — FR-004). */
  addonLines: Array<{
    addonId: string;
    maxQuantity: number;
    priceCents: number;
    sortOrder: number;
  }>;
  /** Sugestões ativas (produto sugerido excluído some daqui — FR-018). */
  suggestions: Array<{
    suggestedProductId: string;
    sortOrder: number;
  }>;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /**
   * Soma dos saldos do produto nos depósitos.
   * Com unidade ativa: só depósitos da unidade; sem: organização inteira.
   * Sempre `0` se `trackStock=false`.
   */
  stock: number;
  /** Nomes das listas de preço que incluem o produto. */
  priceLists: string[];
};

export function toProductResponse(
  product: Product,
  priceLists: string[] = [],
  stock = 0,
): ProductResponse {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    categoryId: product.categoryId,
    unitOfMeasureId: product.unitOfMeasureId,
    type: product.type,
    basePriceCents: product.basePriceCents,
    perishable: product.perishable,
    description: product.description,
    imageUrl: null,
    hasImage: product.hasImage(),
    trackStock: product.trackStock,
    barcodes: product.barcodes,
    availableOnErp: product.availableOnErp,
    availableOnPdv: product.availableOnPdv,
    branchIds: product.branchIds,
    suppliers: product.suppliers,
    variationFormat: product.variationFormat,
    variations: product.variations,
    hasVariants: product.hasVariants,
    variantsCount: product.variantsCount,
    addonSettings: product.addonSettings,
    addonLines: product.addonLines,
    suggestions: product.suggestions,
    deletedAt: product.deletedAt?.toISOString() ?? null,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    stock: product.trackStock ? stock : 0,
    priceLists,
  };
}

export type ProductListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export class ProductPresenter {
  static toHttp(product: Product, priceLists: string[] = [], stock = 0) {
    return { data: toProductResponse(product, priceLists, stock) };
  }

  static toHttpList(
    products: Product[],
    meta: ProductListMeta,
    tabCounts: ProductTabCounts,
    priceListsByProductId: Map<string, string[]> = new Map(),
    stockByProductId: Map<string, number> = new Map(),
  ) {
    return {
      data: products.map((product) =>
        toProductResponse(
          product,
          priceListsByProductId.get(product.id) ?? [],
          stockByProductId.get(product.id) ?? 0,
        ),
      ),
      meta,
      tabCounts,
    };
  }
}
