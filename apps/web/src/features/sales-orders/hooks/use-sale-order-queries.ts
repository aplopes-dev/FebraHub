"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getSaleOrderByIdApi,
  listSaleOrdersApi,
} from "@/features/sales-orders/api/sale-orders.service";
import { saleOrderKeys } from "@/features/sales-orders/hooks/query-keys";
import type { SaleOrderListParams } from "@/features/sales-orders/types/sale-order";
import { useCatalogScope } from "@/lib/organization-context";

export function useSaleOrdersQuery(params: SaleOrderListParams) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: saleOrderKeys.list(scope, params),
    queryFn: () => listSaleOrdersApi(params),
    enabled: ready,
  });
}

export function useSaleOrderQuery(id: string | undefined) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: saleOrderKeys.detail(scope, id ?? ""),
    queryFn: () => getSaleOrderByIdApi(id!),
    enabled: ready && Boolean(id),
  });
}
