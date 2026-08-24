import type {
  CompositionComponentRow,
  ProductionType,
} from "@/features/technical-sheets/types/technical-sheet";
import { PRODUCTION_TYPE_OPTIONS } from "@/features/technical-sheets/lib/technical-sheet-filters";

/** Custo total de uma linha de componente (quantidade × custo unitário). */
export function computeRowTotal(row: CompositionComponentRow): number {
  return row.quantity * row.unitCost;
}

/** Soma dos custos de todos os componentes obrigatórios e opcionais. */
export function computeTotalCost(rows: CompositionComponentRow[]): number {
  return rows.reduce((total, row) => total + computeRowTotal(row), 0);
}

/** Preço sugerido = custo total + markup (%). */
export function computeSuggestedPrice(
  totalCost: number,
  markupPercent: number,
): number {
  const safeMarkup = Number.isFinite(markupPercent) ? markupPercent : 0;
  return totalCost * (1 + safeMarkup / 100);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function productionTypeLabel(type: ProductionType): string {
  return (
    PRODUCTION_TYPE_OPTIONS.find((option) => option.value === type)?.label ??
    type
  );
}
