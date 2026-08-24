import { SERVICE_ORDERS_STORE } from "@/features/service-orders/data/mock-service-orders";
import {
  getServiceOrderStatusById,
  listAllServiceOrderStatuses,
} from "@/features/service-orders/services/service-order-status.service";
import {
  computeOrderTotal,
  computeServiceOrderTotal,
} from "@/features/service-orders/lib/service-order-totals";
import { formatServiceOrderCode } from "@/features/service-orders/lib/service-order-form-values";
import type { ServiceOrderFormValues } from "@/features/service-orders/lib/service-order-form-values";
import { partsToIso } from "@/features/service-orders/lib/service-order-form-values";
import { createSaleOrder } from "@/features/sales-orders/services/sale-order-list.service";
import type {
  ServiceOrder,
  ServiceOrderListParams,
  ServiceOrderListResult,
  ServiceOrderListTab,
  ServiceOrderTabCounts,
} from "@/features/service-orders/types/service-order";

let ordersStore: ServiceOrder[] = SERVICE_ORDERS_STORE.map((order) => ({
  ...order,
}));

function resolveTab(order: ServiceOrder): ServiceOrderListTab {
  return getServiceOrderStatusById(order.statusId)?.baseType ?? "open";
}

function matchesSearch(order: ServiceOrder, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    order.code,
    order.customerName,
    order.technicianName,
    ...order.equipments.flatMap((equipment) => [
      equipment.name,
      equipment.serialNumber,
    ]),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function matchesFilters(
  order: ServiceOrder,
  filters: ServiceOrderListParams["filters"],
): boolean {
  if (filters.statusIds.length > 0 && !filters.statusIds.includes(order.statusId)) {
    return false;
  }
  if (
    filters.technicianName &&
    order.technicianName !== filters.technicianName
  ) {
    return false;
  }
  const openedDay = order.openedAt.slice(0, 10);
  if (filters.openedFrom && openedDay < filters.openedFrom) return false;
  if (filters.openedTo && openedDay > filters.openedTo) return false;
  return true;
}

function computeTabCounts(all: readonly ServiceOrder[]): ServiceOrderTabCounts {
  const counts: ServiceOrderTabCounts = {
    open: 0,
    in_progress: 0,
    ready: 0,
    closed: 0,
    canceled: 0,
  };
  for (const order of all) {
    counts[resolveTab(order)] += 1;
  }
  return counts;
}

function sortOrders(
  orders: ServiceOrder[],
  sort: ServiceOrderListParams["sort"],
): ServiceOrder[] {
  const sorted = [...orders];
  switch (sort) {
    case "opened_at_asc":
      return sorted.sort((a, b) => a.openedAt.localeCompare(b.openedAt));
    case "due_at_asc":
      return sorted.sort((a, b) =>
        (a.dueAt ?? "9999").localeCompare(b.dueAt ?? "9999"),
      );
    case "amount_desc":
      return sorted.sort(
        (a, b) => computeOrderTotal(b) - computeOrderTotal(a),
      );
    case "amount_asc":
      return sorted.sort(
        (a, b) => computeOrderTotal(a) - computeOrderTotal(b),
      );
    case "number_asc":
      return sorted.sort((a, b) => a.number - b.number);
    case "number_desc":
      return sorted.sort((a, b) => b.number - a.number);
    case "opened_at_desc":
    default:
      return sorted.sort((a, b) => b.openedAt.localeCompare(a.openedAt));
  }
}

export function listServiceOrders(
  params: ServiceOrderListParams,
): ServiceOrderListResult {
  const tabCounts = computeTabCounts(ordersStore);

  const filtered = ordersStore.filter(
    (order) =>
      resolveTab(order) === params.tab &&
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
    meta: { total, page, perPage: params.perPage, totalPages },
    tabCounts,
  };
}

export function getServiceOrderById(id: string): ServiceOrder | undefined {
  return ordersStore.find((order) => order.id === id);
}

function nextServiceOrderNumber(): number {
  return ordersStore.reduce((max, order) => Math.max(max, order.number), 0) + 1;
}

function formValuesToOrderFields(values: ServiceOrderFormValues) {
  return {
    customerName: values.customerName.trim(),
    customerPhone: values.customerPhone.trim(),
    openedAt:
      partsToIso(values.openedDate, values.openedTime) ??
      new Date().toISOString(),
    dueAt: partsToIso(values.dueDate, values.dueTime),
    sellerName: values.sellerName,
    technicianName: values.technicianName,
    statusId: values.statusId,
    equipments: values.equipments.map((equipment) => ({ ...equipment })),
    lines: values.lines.map((line) => ({ ...line })),
    budget: { ...values.budget },
  };
}

export function createServiceOrder(
  values: ServiceOrderFormValues,
): ServiceOrder {
  const number = nextServiceOrderNumber();
  const order: ServiceOrder = {
    id: `os-${crypto.randomUUID().slice(0, 8)}`,
    code: formatServiceOrderCode(number),
    number,
    ...formValuesToOrderFields(values),
    generatedSaleId: null,
    createdBy: "Operador",
  };
  ordersStore = [order, ...ordersStore];
  return order;
}

export function updateServiceOrder(
  id: string,
  values: ServiceOrderFormValues,
): ServiceOrder | undefined {
  const current = ordersStore.find((order) => order.id === id);
  if (!current) return undefined;

  const updated: ServiceOrder = {
    ...current,
    ...formValuesToOrderFields(values),
  };
  ordersStore = ordersStore.map((order) => (order.id === id ? updated : order));
  return updated;
}

/** Move a OS para o primeiro status de tipo-base `canceled`. */
export function cancelServiceOrder(id: string): boolean {
  const canceledStatus = listAllServiceOrderStatuses().find(
    (status) => status.baseType === "canceled",
  );
  const current = ordersStore.find((order) => order.id === id);
  if (!current || !canceledStatus) return false;

  ordersStore = ordersStore.map((order) =>
    order.id === id ? { ...order, statusId: canceledStatus.id } : order,
  );
  return true;
}

/** Um status está em uso por alguma OS? (bloqueia exclusão no gerenciador) */
export function isServiceOrderStatusInUse(statusId: string): boolean {
  return ordersStore.some((order) => order.statusId === statusId);
}

/**
 * Fatura a OS: cria a venda (status "closed") no store de Vendas via
 * `createSaleOrder`, move a OS para o primeiro status `closed` e vincula o id
 * da venda gerada.
 */
export function generateSaleFromServiceOrder(
  id: string,
): { order: ServiceOrder; saleId: string; saleNumber: number } | undefined {
  const current = ordersStore.find((order) => order.id === id);
  if (!current) return undefined;

  const closedStatus = listAllServiceOrderStatuses().find(
    (status) => status.baseType === "closed",
  );

  const sale = createSaleOrder({
    customerName: current.customerName,
    totalAmount: computeServiceOrderTotal(current.lines),
    status: "closed",
    createdBy: current.createdBy,
    soldAt: new Date().toISOString().slice(0, 10),
  });

  const updated: ServiceOrder = {
    ...current,
    statusId: closedStatus?.id ?? current.statusId,
    generatedSaleId: sale.id,
  };
  ordersStore = ordersStore.map((order) => (order.id === id ? updated : order));
  return { order: updated, saleId: sale.id, saleNumber: sale.number };
}
