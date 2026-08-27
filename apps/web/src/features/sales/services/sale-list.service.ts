import { SALE_ORDERS_STORE } from "@/features/sales-orders/data/mock-sale-orders";
import { isCreatedAtInPeriod } from "@/features/sales-orders/lib/sale-order-period";
import { deleteSaleOrder } from "@/features/sales-orders/services/sale-order-list.service";
import type {
  SaleOrder,
  SaleOrderListFilters,
  SaleOrderSortOption,
} from "@/features/sales-orders/types/sale-order";
import type { SaleListParams, SaleListResult } from "@/features/sales/types/sale";

export { deleteSaleOrder as removeSale };

function matchesSearch(sale: SaleOrder, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  const numberLabel = `#${sale.number}`;
  return (
    numberLabel.includes(q) ||
    String(sale.number).includes(q) ||
    sale.customerName.toLowerCase().includes(q) ||
    sale.createdBy.toLowerCase().includes(q)
  );
}

function matchesFilters(
  sale: SaleOrder,
  filters: SaleOrderListFilters,
): boolean {
  if (filters.statuses.length > 0 && !filters.statuses.includes(sale.status)) {
    return false;
  }
  if (filters.amountMin != null && sale.totalAmount < filters.amountMin) {
    return false;
  }
  if (filters.amountMax != null && sale.totalAmount > filters.amountMax) {
    return false;
  }
  if (!isCreatedAtInPeriod(sale.createdAt, filters.period)) {
    return false;
  }
  return true;
}

function sortSales(
  sales: SaleOrder[],
  sort: SaleOrderSortOption,
): SaleOrder[] {
  const sorted = [...sales];
  sorted.sort((a, b) => {
    switch (sort) {
      case "created_at_desc":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "created_at_asc":
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case "amount_desc":
        return b.totalAmount - a.totalAmount;
      case "amount_asc":
        return a.totalAmount - b.totalAmount;
      case "number_asc":
        return a.number - b.number;
      case "number_desc":
        return b.number - a.number;
      default:
        return 0;
    }
  });
  return sorted;
}

/** Vendas = pedidos não excluídos do mesmo store de `features/sales-orders` (sem abas). */
export function listSales(params: SaleListParams): SaleListResult {
  const notDeleted = SALE_ORDERS_STORE.filter((sale) => sale.deletedAt == null);

  const filtered = notDeleted.filter(
    (sale) =>
      matchesSearch(sale, params.search) &&
      matchesFilters(sale, params.filters),
  );

  const sorted = sortSales(filtered, params.sort);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / params.perPage));
  const page = Math.min(Math.max(1, params.page), totalPages);
  const start = (page - 1) * params.perPage;
  const data = sorted.slice(start, start + params.perPage);

  return {
    data,
    meta: {
      total,
      page,
      perPage: params.perPage,
      totalPages,
    },
  };
}
