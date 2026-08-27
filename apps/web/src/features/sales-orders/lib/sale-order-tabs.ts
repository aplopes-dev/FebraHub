import type {
  SaleOrder,
  SaleOrderListTab,
  SaleOrderTabCounts,
} from "@/features/sales-orders/types/sale-order";

export function matchesTab(
  order: SaleOrder,
  tab: SaleOrderListTab,
): boolean {
  const isDeleted = Boolean(order.deletedAt);
  switch (tab) {
    case "open":
      return !isDeleted;
    case "deleted":
      return isDeleted;
    default:
      return !isDeleted;
  }
}

export function computeTabCounts(orders: SaleOrder[]): SaleOrderTabCounts {
  return {
    open: orders.filter((order) => matchesTab(order, "open")).length,
    deleted: orders.filter((order) => matchesTab(order, "deleted")).length,
  };
}

export const SALE_ORDER_TAB_LABELS: Record<SaleOrderListTab, string> = {
  open: "Aberto",
  deleted: "Excluídos",
};

export const SALE_ORDER_TAB_ORDER: SaleOrderListTab[] = ["open", "deleted"];
