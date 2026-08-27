import type { Product } from "@/features/products/types/product";
import type {
  ProductionType,
  TechnicalSheetListItem,
} from "@/features/technical-sheets/types/technical-sheet";

const PRODUCTION_BY_INDEX: ProductionType[] = [
  "automatic",
  "automatic",
  "productive_process",
  "automatic",
  "productive_process",
  "automatic",
];

export function buildTechnicalSheetsFromProducts(
  products: Product[],
): TechnicalSheetListItem[] {
  return products
    .filter((product) => product.type !== "supply" && !product.deletedAt)
    .map((product, index) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      imageUrl: product.imageUrl,
      category: product.category,
      productionType: PRODUCTION_BY_INDEX[index % PRODUCTION_BY_INDEX.length],
      hasComposition: index % 3 !== 2,
    }));
}
