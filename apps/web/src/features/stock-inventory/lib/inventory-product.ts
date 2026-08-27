import type { InventoryLine } from "@/features/stock-inventory/types/inventory";

export type InventoryProductInfo = {
  name: string;
  sku: string;
  imageUrl?: string;
};

/** Resolve nome/sku a partir da linha (API) ou fallback. */
export function resolveInventoryProduct(
  line: InventoryLine | string,
): InventoryProductInfo {
  if (typeof line === "string") {
    return {
      name: "Produto",
      sku: "—",
    };
  }
  return {
    name: line.productName ?? "Produto",
    sku: line.productSku ?? "—",
    imageUrl: line.productImageUrl,
  };
}
