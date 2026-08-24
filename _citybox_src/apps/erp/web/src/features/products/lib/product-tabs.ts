import type {
  Product,
  ProductListTab,
  ProductTabCounts,
} from "@/features/products/types/product";

export function matchesTab(product: Product, tab: ProductListTab): boolean {
  const isDeleted = Boolean(product.deletedAt);

  switch (tab) {
    case "all":
      return !isDeleted;
    case "with_variants":
      return !isDeleted && product.hasVariants;
    case "supplies":
      return !isDeleted && product.type === "supply";
    case "deleted":
      return isDeleted;
    default:
      return !isDeleted;
  }
}

export function computeTabCounts(products: Product[]): ProductTabCounts {
  return {
    all: products.filter((p) => matchesTab(p, "all")).length,
    with_variants: products.filter((p) => matchesTab(p, "with_variants")).length,
    supplies: products.filter((p) => matchesTab(p, "supplies")).length,
    deleted: products.filter((p) => matchesTab(p, "deleted")).length,
  };
}

export const PRODUCT_TAB_LABELS: Record<ProductListTab, string> = {
  all: "Todos",
  with_variants: "Com variação",
  supplies: "Insumos",
  deleted: "Excluídos",
};

export const PRODUCT_TAB_ORDER: ProductListTab[] = [
  "all",
  "with_variants",
  "supplies",
  "deleted",
];
