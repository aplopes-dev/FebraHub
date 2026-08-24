import type {
  FiscalParameterListFilters,
  FiscalStatus,
} from "@/features/fiscal-parameters/types/fiscal-parameters";

export function createEmptyFiscalParameterFilters(): FiscalParameterListFilters {
  return {
    categories: [],
    statuses: [],
  };
}

export function countActiveFiscalParameterFilters(
  filters: FiscalParameterListFilters,
): number {
  let count = 0;
  if (filters.categories.length > 0) count += 1;
  if (filters.statuses.length > 0) count += 1;
  return count;
}

export const FISCAL_STATUS_OPTIONS: {
  value: FiscalStatus;
  label: string;
}[] = [
  { value: "configured", label: "Configurado" },
  { value: "pending", label: "Pendente" },
];

export const FISCAL_PARAMETER_SORT_OPTIONS = [
  { value: "name_asc" as const, label: "Nome (A–Z)" },
  { value: "name_desc" as const, label: "Nome (Z–A)" },
  { value: "category_asc" as const, label: "Categoria (A–Z)" },
  { value: "category_desc" as const, label: "Categoria (Z–A)" },
];
