import { listPaymentMethods } from "@/features/sales-orders/data/mock-payment-methods";
import { MOCK_SALE_ORDER_SELLERS } from "@/features/sales-orders/data/mock-sale-order-sellers";
import { SALE_ORDERS_STORE } from "@/features/sales-orders/data/mock-sale-orders";
import { isCreatedAtInPeriod } from "@/features/sales-orders/lib/sale-order-period";
import {
  computeTabCounts,
  matchesTab,
} from "@/features/sales-orders/lib/sale-order-tabs";
import type {
  SaleOrderSellerOption,
  SaveSaleOrderInput,
} from "@/features/sales-orders/types/sale-order-form";
import type {
  SaleOrder,
  SaleOrderListFilters,
  SaleOrderListParams,
  SaleOrderListResult,
  SaleOrderSortOption,
  SaleOrderStatus,
} from "@/features/sales-orders/types/sale-order";

export { listPaymentMethods };

function matchesSearch(order: SaleOrder, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  const numberLabel = `#${order.number}`;
  return (
    numberLabel.includes(q) ||
    String(order.number).includes(q) ||
    order.customerName.toLowerCase().includes(q) ||
    order.createdBy.toLowerCase().includes(q)
  );
}

function matchesFilters(
  order: SaleOrder,
  filters: SaleOrderListFilters,
): boolean {
  if (filters.statuses.length > 0 && !filters.statuses.includes(order.status)) {
    return false;
  }
  if (filters.channelId != null && order.channelId !== filters.channelId) {
    return false;
  }
  if (filters.amountMin != null && order.totalAmount < filters.amountMin) {
    return false;
  }
  if (filters.amountMax != null && order.totalAmount > filters.amountMax) {
    return false;
  }
  if (!isCreatedAtInPeriod(order.createdAt, filters.period)) {
    return false;
  }
  return true;
}

function sortOrders(
  orders: SaleOrder[],
  sort: SaleOrderSortOption,
): SaleOrder[] {
  const sorted = [...orders];
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

export function listSaleOrders(
  params: SaleOrderListParams,
): SaleOrderListResult {
  const tabCounts = computeTabCounts(SALE_ORDERS_STORE);

  const filtered = SALE_ORDERS_STORE.filter(
    (order) =>
      matchesTab(order, params.tab) &&
      matchesSearch(order, params.search) &&
      matchesFilters(order, params.filters),
  );

  const sorted = sortOrders(filtered, params.sort);
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
    tabCounts,
  };
}

export function formatSaleOrderAmount(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatSaleOrderCreatedAt(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function updateSaleOrderStatus(
  id: string,
  status: SaleOrderStatus,
): boolean {
  const index = SALE_ORDERS_STORE.findIndex((order) => order.id === id);
  if (index < 0) return false;
  const current = SALE_ORDERS_STORE[index];
  if (!current || current.deletedAt != null) return false;
  SALE_ORDERS_STORE[index] = { ...current, status };
  return true;
}

export function deleteSaleOrder(id: string): boolean {
  const index = SALE_ORDERS_STORE.findIndex((order) => order.id === id);
  if (index < 0) return false;
  const current = SALE_ORDERS_STORE[index];
  if (!current || current.deletedAt != null) return false;
  SALE_ORDERS_STORE[index] = {
    ...current,
    deletedAt: new Date().toISOString(),
  };
  return true;
}

export function listSaleOrderSellers(): SaleOrderSellerOption[] {
  return MOCK_SALE_ORDER_SELLERS.map((seller) => ({ ...seller }));
}

export function getSaleOrderById(id: string): SaleOrder | null {
  const found = SALE_ORDERS_STORE.find((order) => order.id === id);
  return found ? { ...found } : null;
}

function nextSaleOrderNumber(): number {
  if (SALE_ORDERS_STORE.length === 0) return 1;
  return Math.max(...SALE_ORDERS_STORE.map((order) => order.number)) + 1;
}

function saleOrderDetailsFromInput(
  input: SaveSaleOrderInput,
): Pick<
  SaleOrder,
  | "warehouseId"
  | "customerId"
  | "sellerId"
  | "notes"
  | "lines"
  | "payments"
  | "deliveryFee"
  | "discounts"
> {
  return {
    warehouseId: input.warehouseId,
    customerId: input.customerId,
    sellerId: input.sellerId,
    notes: input.notes,
    lines: input.lines?.map((line) => ({ ...line })),
    payments: input.payments?.map((payment) => ({ ...payment })),
    deliveryFee: input.deliveryFee,
    discounts: input.discounts,
  };
}

export function createSaleOrder(input: SaveSaleOrderInput): SaleOrder {
  const soldAtDate = /^\d{4}-\d{2}-\d{2}$/.test(input.soldAt)
    ? `${input.soldAt}T12:00:00.000Z`
    : new Date().toISOString();

  const order: SaleOrder = {
    id: `so-${crypto.randomUUID().slice(0, 8)}`,
    number: nextSaleOrderNumber(),
    customerName: input.customerName.trim() || "Consumidor final",
    totalAmount: Math.round(input.totalAmount * 100) / 100,
    status: input.status,
    channelId: "pdv",
    createdBy: input.createdBy,
    createdAt: soldAtDate,
    ...saleOrderDetailsFromInput(input),
  };

  SALE_ORDERS_STORE.unshift(order);
  return order;
}

export function updateSaleOrder(
  id: string,
  input: SaveSaleOrderInput,
): SaleOrder | null {
  const index = SALE_ORDERS_STORE.findIndex((order) => order.id === id);
  if (index < 0) return null;
  const current = SALE_ORDERS_STORE[index];
  if (!current || current.deletedAt != null) return null;

  const soldAtDate = /^\d{4}-\d{2}-\d{2}$/.test(input.soldAt)
    ? `${input.soldAt}T12:00:00.000Z`
    : current.createdAt;

  const updated: SaleOrder = {
    ...current,
    customerName: input.customerName.trim() || "Consumidor final",
    totalAmount: Math.round(input.totalAmount * 100) / 100,
    status: input.status,
    createdBy: input.createdBy,
    createdAt: soldAtDate,
    ...saleOrderDetailsFromInput(input),
  };

  SALE_ORDERS_STORE[index] = updated;
  return updated;
}
