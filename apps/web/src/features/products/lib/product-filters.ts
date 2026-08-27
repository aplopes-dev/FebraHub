import type { ProductListFilters } from "@/features/products/types/product";

export function createEmptyProductFilters(): ProductListFilters {
  return {
    types: [],
    stock: "all",
    variants: "all",
    categories: [],
    channels: [],
  };
}

export function countActiveProductFilters(filters: ProductListFilters): number {
  let count = 0;
  if (filters.types.length > 0) count += 1;
  if (filters.stock !== "all") count += 1;
  if (filters.variants !== "all") count += 1;
  if (filters.categories.length > 0) count += 1;
  if (filters.channels.length > 0) count += 1;
  return count;
}

/** Canais do filtro de produtos (disponibilidade). Distinto de listas de preço. */
export const PRODUCT_FILTER_CHANNEL_OPTIONS = [
  { id: "erp" as const, name: "ERP" },
  { id: "pdv" as const, name: "Ponto de venda" },
];

export const PRODUCT_TYPE_OPTIONS = [
  { value: "simple" as const, label: "Simples" },
  { value: "collection" as const, label: "Coleção" },
  { value: "supply" as const, label: "Insumo" },
];

export const PRODUCT_STOCK_OPTIONS = [
  { value: "all" as const, label: "Todos" },
  { value: "in_stock" as const, label: "Estoque disponível" },
  { value: "out_of_stock" as const, label: "Sem estoque" },
];

export const PRODUCT_VARIANTS_OPTIONS = [
  { value: "all" as const, label: "Todos" },
  { value: "with" as const, label: "Com variação" },
  { value: "without" as const, label: "Sem variação" },
];

export const PRODUCT_SORT_OPTIONS = [
  { value: "name_asc" as const, label: "Nome (A–Z)" },
  { value: "name_desc" as const, label: "Nome (Z–A)" },
  { value: "price_asc" as const, label: "Preço (menor)" },
  { value: "price_desc" as const, label: "Preço (maior)" },
  { value: "stock_asc" as const, label: "Estoque (menor)" },
  { value: "stock_desc" as const, label: "Estoque (maior)" },
];
