"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getServiceOrderByIdApi,
  listServiceOrdersApi,
  listServiceOrderStatusesApi,
} from "@/features/service-orders/api/service-orders.service";
import { serviceOrderKeys } from "@/features/service-orders/hooks/query-keys";
import { hydrateServiceOrderStatuses } from "@/features/service-orders/services/service-order-status.service";
import type { ServiceOrderListParams } from "@/features/service-orders/types/service-order";
import { useCatalogScope } from "@/lib/organization-context";

export function useServiceOrdersQuery(params: ServiceOrderListParams) {
  const { scope, ready } = useCatalogScope();
  return useQuery({
    queryKey: serviceOrderKeys.list(scope, params),
    queryFn: () => listServiceOrdersApi(params),
    enabled: ready,
  });
}

export function useServiceOrderQuery(id: string | undefined) {
  const { scope, ready } = useCatalogScope();
  return useQuery({
    queryKey: serviceOrderKeys.detail(scope, id ?? ""),
    queryFn: () => getServiceOrderByIdApi(id!),
    enabled: ready && Boolean(id),
  });
}

export function useServiceOrderStatusesQuery() {
  const { scope, ready } = useCatalogScope();
  return useQuery({
    queryKey: serviceOrderKeys.statuses(scope),
    queryFn: async () => {
      const statuses = await listServiceOrderStatusesApi();
      hydrateServiceOrderStatuses(statuses);
      return statuses;
    },
    enabled: ready,
  });
}
