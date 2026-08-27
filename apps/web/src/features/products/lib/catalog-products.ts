import type { Product } from "@/features/products/types/product";

export function extractProductCategories(products: Product[]): string[] {
  return [
    ...new Set(products.map((product) => product.category).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export function listActiveCatalogProducts(products: Product[]): Product[] {
  return products.filter((product) => !product.deletedAt);
}
