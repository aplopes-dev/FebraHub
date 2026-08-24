import type { PriceList } from "@/features/price-lists/types/price-list";

/**
 * Aplica a regra de ajuste da lista sobre o preço base do produto e devolve o
 * preço sugerido. O resultado nunca é negativo.
 */
export function computeAdjustedPrice(base: number, list: PriceList): number {
  const value = list.adjustmentValue;

  switch (list.adjustmentType) {
    case "percent_markup": {
      const price = base * (1 + value / 100);
      return roundToCents(Math.max(0, price));
    }
    case "percent_discount": {
      const price = base * (1 - value / 100);
      return roundToCents(Math.max(0, price));
    }
    case "fixed_over_base": {
      const price = base + value;
      return roundToCents(Math.max(0, price));
    }
    case "manual":
    default:
      return roundToCents(Math.max(0, base));
  }
}

function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}
