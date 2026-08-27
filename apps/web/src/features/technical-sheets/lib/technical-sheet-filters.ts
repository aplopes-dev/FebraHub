import type {
  ProductionType,
  TechnicalSheetListFilters,
} from "@/features/technical-sheets/types/technical-sheet";

export function createEmptyTechnicalSheetFilters(): TechnicalSheetListFilters {
  return {
    categories: [],
    productionTypes: [],
  };
}

export function countActiveTechnicalSheetFilters(
  filters: TechnicalSheetListFilters,
): number {
  let count = 0;
  if (filters.categories.length > 0) count += 1;
  if (filters.productionTypes.length > 0) count += 1;
  return count;
}

export const PRODUCTION_TYPE_OPTIONS: {
  value: ProductionType;
  label: string;
  description: string;
}[] = [
  {
    value: "automatic",
    label: "Produção automática",
    description:
      "O estoque dos insumos é baixado automaticamente no momento da venda.",
  },
  {
    value: "productive_process",
    label: "Processo produtivo",
    description:
      "Para produzir e estocar antes de vender (exige ordem de produção).",
  },
];

export const TECHNICAL_SHEET_SORT_OPTIONS = [
  { value: "name_asc" as const, label: "Nome (A–Z)" },
  { value: "name_desc" as const, label: "Nome (Z–A)" },
  { value: "category_asc" as const, label: "Categoria (A–Z)" },
  { value: "category_desc" as const, label: "Categoria (Z–A)" },
];
