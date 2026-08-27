"use client";

import { apiFetch } from "@/lib/api/client";
import type {
  ServiceOrderHttpDto,
  ServiceOrderStatusHttpDto,
  ServiceOrderWritablePayload,
} from "./service-order.dto";
import { toServiceOrder } from "./service-order.mapper";
import type {
  ServiceOrder,
  ServiceOrderListParams,
  ServiceOrderListResult,
  ServiceOrderListTab,
  ServiceOrderTabCounts,
} from "../types/service-order";
import type {
  ServiceOrderStatus,
  ServiceOrderStatusBaseType,
} from "../types/service-order-status";

type ListResponse = {
  data: ServiceOrderHttpDto[];
  meta: { total: number; page: number; perPage: number; totalPages: number };
};

const EMPTY_TAB_COUNTS: ServiceOrderTabCounts = {
  open: 0,
  in_progress: 0,
  ready: 0,
  closed: 0,
  canceled: 0,
};

function resolveTab(dto: ServiceOrderHttpDto): ServiceOrderListTab {
  return (dto.statusBaseType as ServiceOrderListTab) ?? "open";
}

export async function listServiceOrderStatusesApi(): Promise<
  ServiceOrderStatus[]
> {
  const res = await apiFetch<{ data: ServiceOrderStatusHttpDto[] }>(
    "/v1/service-order-statuses",
  );
  return res.data.map((row) => ({
    id: row.id,
    name: row.name,
    baseType: row.baseType as ServiceOrderStatusBaseType,
    variant: "secondary" as const,
    sortOrder: row.sortOrder,
    active: row.active,
  }));
}

export async function createServiceOrderStatusApi(input: {
  name: string;
  baseType: ServiceOrderStatusBaseType;
  sortOrder?: number;
}): Promise<ServiceOrderStatus> {
  const row = await apiFetch<ServiceOrderStatusHttpDto>(
    "/v1/service-order-statuses",
    { method: "POST", body: JSON.stringify(input) },
  );
  return {
    id: row.id,
    name: row.name,
    baseType: row.baseType as ServiceOrderStatusBaseType,
    variant: "secondary",
    sortOrder: row.sortOrder,
    active: row.active,
  };
}

export async function updateServiceOrderStatusApi(
  id: string,
  input: {
    name: string;
    baseType: ServiceOrderStatusBaseType;
    sortOrder?: number;
  },
): Promise<ServiceOrderStatus> {
  const row = await apiFetch<ServiceOrderStatusHttpDto>(
    `/v1/service-order-statuses/${id}`,
    { method: "PUT", body: JSON.stringify(input) },
  );
  return {
    id: row.id,
    name: row.name,
    baseType: row.baseType as ServiceOrderStatusBaseType,
    variant: "secondary",
    sortOrder: row.sortOrder,
    active: row.active,
  };
}

export async function deleteServiceOrderStatusApi(id: string): Promise<void> {
  await apiFetch<void>(`/v1/service-order-statuses/${id}`, {
    method: "DELETE",
  });
}

export async function listServiceOrdersApi(
  params: ServiceOrderListParams,
): Promise<ServiceOrderListResult> {
  const query = new URLSearchParams();
  if (params.search.trim()) query.set("search", params.search.trim());
  if (params.filters.statusIds.length === 1) {
    query.set("statusId", params.filters.statusIds[0]!);
  }
  query.set("page", "1");
  query.set("perPage", "100");

  const response = await apiFetch<ListResponse>(
    `/v1/service-orders?${query.toString()}`,
  );

  const tabCounts = { ...EMPTY_TAB_COUNTS };
  for (const dto of response.data) {
    tabCounts[resolveTab(dto)] += 1;
  }

  let filtered = response.data.filter((dto) => {
    if (resolveTab(dto) !== params.tab) return false;
    if (
      params.filters.statusIds.length > 0 &&
      !params.filters.statusIds.includes(dto.statusId)
    ) {
      return false;
    }
    if (
      params.filters.technicianName &&
      dto.technicianName !== params.filters.technicianName
    ) {
      return false;
    }
    const openedDay = dto.openedAt.slice(0, 10);
    if (params.filters.openedFrom && openedDay < params.filters.openedFrom) {
      return false;
    }
    if (params.filters.openedTo && openedDay > params.filters.openedTo) {
      return false;
    }
    return true;
  });

  const orders = filtered.map(toServiceOrder);
  const total = orders.length;
  const totalPages = Math.max(1, Math.ceil(total / params.perPage));
  const page = Math.min(Math.max(1, params.page), totalPages);
  const start = (page - 1) * params.perPage;

  return {
    data: orders.slice(start, start + params.perPage),
    meta: { total, page, perPage: params.perPage, totalPages },
    tabCounts,
  };
}

export async function getServiceOrderByIdApi(
  id: string,
): Promise<ServiceOrder> {
  const dto = await apiFetch<ServiceOrderHttpDto>(
    `/v1/service-orders/${id}`,
  );
  return toServiceOrder(dto);
}

export async function createServiceOrderApi(
  payload: ServiceOrderWritablePayload,
): Promise<ServiceOrder> {
  const dto = await apiFetch<ServiceOrderHttpDto>("/v1/service-orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return toServiceOrder(dto);
}

export async function updateServiceOrderApi(
  id: string,
  payload: ServiceOrderWritablePayload,
): Promise<ServiceOrder> {
  const dto = await apiFetch<ServiceOrderHttpDto>(
    `/v1/service-orders/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
  return toServiceOrder(dto);
}

export async function generateSaleFromServiceOrderApi(id: string): Promise<{
  saleId: string;
  saleNumber: number;
}> {
  const sale = await apiFetch<{ id: string; number: number }>(
    `/v1/service-orders/${id}/generate-sale`,
    { method: "POST" },
  );
  return { saleId: sale.id, saleNumber: sale.number };
}
