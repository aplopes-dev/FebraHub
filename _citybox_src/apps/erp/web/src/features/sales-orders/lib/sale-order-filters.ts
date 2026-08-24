import { createDefaultSaleOrderPeriod } from "@/features/sales-orders/lib/sale-order-period";
import type {
  SaleOrderListFilters,
  SaleOrderSortOption,
} from "@/features/sales-orders/types/sale-order";

export function createEmptySaleOrderFilters(): SaleOrderListFilters {
  return {
    statuses: [],
    channelId: null,
    amountMin: null,
    amountMax: null,
    period: createDefaultSaleOrderPeriod(),
  };
}

export function countActiveSaleOrderFilters(
  filters: SaleOrderListFilters,
): number {
  let count = 0;
  if (filters.statuses.length > 0) count += 1;
  if (filters.channelId != null) count += 1;
  if (filters.amountMin != null) count += 1;
  if (filters.amountMax != null) count += 1;
  if (filters.period.preset !== "all") {
    if (filters.period.preset === "custom") {
      if (filters.period.customFrom || filters.period.customTo) count += 1;
    } else {
      count += 1;
    }
  }
  return count;
}

export const SALE_ORDER_SORT_OPTIONS: {
  value: SaleOrderSortOption;
  label: string;
}[] = [
  { value: "created_at_desc", label: "Criado em (mais recente)" },
  { value: "created_at_asc", label: "Criado em (mais antigo)" },
  { value: "amount_desc", label: "Valor (maior)" },
  { value: "amount_asc", label: "Valor (menor)" },
  { value: "number_asc", label: "Pedido (# crescente)" },
  { value: "number_desc", label: "Pedido (# decrescente)" },
];
