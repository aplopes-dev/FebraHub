import type {
  BulkPriceOperation,
  PriceListFormValues,
  PriceListItemPrice,
} from "@/features/price-lists/types/price-list";

export function createEmptyPriceListFormValues(): PriceListFormValues {
  return {
    name: "",
    adjustmentType: "manual",
    adjustmentValue: 0,
    channels: [],
    branchIds: [],
    startDate: null,
    endDate: null,
    active: true,
  };
}

export function areItemPricesEqual(
  a: PriceListItemPrice[],
  b: PriceListItemPrice[],
): boolean {
  if (a.length !== b.length) return false;
  return a.every((item, index) => {
    const other = b[index];
    return (
      other != null &&
      item.productId === other.productId &&
      item.price === other.price
    );
  });
}

/** Aplica uma operação de edição em lote sobre um preço, nunca resultando negativo. */
export function applyBulkOperation(
  currentPrice: number,
  operation: BulkPriceOperation,
  value: number,
): number {
  const safeValue = Number.isFinite(value) && value >= 0 ? value : 0;
  switch (operation) {
    case "increase_percent":
      return currentPrice * (1 + safeValue / 100);
    case "decrease_percent":
      return Math.max(0, currentPrice * (1 - safeValue / 100));
    case "increase_fixed":
      return currentPrice + safeValue;
    case "decrease_fixed":
      return Math.max(0, currentPrice - safeValue);
    case "set_value":
      return safeValue;
    default:
      return currentPrice;
  }
}
