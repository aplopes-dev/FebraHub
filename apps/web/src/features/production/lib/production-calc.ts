import type { ComputedInsumo } from "@/features/production/types/production";

/** Formata a quantidade com até 3 casas (kg/L fracionados). */
export function formatQuantity(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(value);
}

export function formatCurrencyCents(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

/**
 * Recalcula os insumos (vindos da API para `plannedQuantity`/`producedQuantity`)
 * para uma quantidade editada ao vivo pelo usuário — mesma fórmula do backend
 * (`computeInsumos` em `build-production-movements.ts`): quantidade por
 * unidade × quantidade produzida, custo total = quantidade total × custo
 * unitário do insumo.
 */
export function scaleInsumos(
  insumos: ComputedInsumo[],
  quantity: number,
): ComputedInsumo[] {
  const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
  return insumos.map((insumo) => {
    const totalQuantity = insumo.quantityPerUnit * safeQuantity;
    return {
      ...insumo,
      totalQuantity,
      totalCostCents: Math.round(totalQuantity * insumo.unitCostCents),
    };
  });
}

export function sumInsumosCostCents(insumos: ComputedInsumo[]): number {
  return insumos.reduce((total, item) => total + item.totalCostCents, 0);
}
