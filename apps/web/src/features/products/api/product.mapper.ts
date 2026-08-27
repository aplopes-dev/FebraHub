import type { Product } from "@/features/products/types/product";
import type { ProductCategoryDto, ProductDto } from "./product.dto";
import { productImageProxyUrl } from "./product-image-url";

/**
 * Converte o DTO da API no tipo `Product` que a UI já usa.
 *
 * Traduções:
 * 1. **centavos → reais** (`basePriceCents` → `basePrice`, `sellPriceCents` → `sellPrice`);
 * 2. **categoryId → nome** (via índice de categorias);
 * 3. **hasImage → URL do proxy** (a object key do MinIO nunca vai ao browser).
 */
export function centsToReais(cents: number): number {
  return cents / 100;
}

export function reaisToCents(reais: number): number {
  return Math.round(reais * 100);
}

export type CategoryNameIndex = Map<string, string>;

export function buildCategoryNameIndex(
  categories: ProductCategoryDto[],
): CategoryNameIndex {
  return new Map(categories.map((category) => [category.id, category.name]));
}

export function toProduct(
  dto: ProductDto,
  categoryNames?: CategoryNameIndex,
): Product {
  return {
    id: dto.id,
    name: dto.name,
    sku: dto.sku,
    imageUrl: dto.hasImage ? productImageProxyUrl(dto.id) : undefined,
    category: categoryNames?.get(dto.categoryId) ?? "",
    basePrice: centsToReais(dto.basePriceCents),
    sellPrice: centsToReais(dto.sellPriceCents ?? dto.basePriceCents),
    stock: dto.stock,
    trackStock: dto.trackStock,
    variantsCount: dto.variantsCount,
    priceLists: dto.priceLists,
    channels: [
      {
        id: "erp",
        name: "ERP",
        enabled: dto.availableOnErp ?? true,
      },
      {
        id: "pdv",
        name: "Ponto de venda",
        enabled: dto.availableOnPdv ?? true,
      },
    ],
    type: dto.type,
    hasVariants: dto.hasVariants,
    deletedAt: dto.deletedAt,
  };
}
