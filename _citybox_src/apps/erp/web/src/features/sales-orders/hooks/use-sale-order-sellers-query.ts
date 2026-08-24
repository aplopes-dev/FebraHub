"use client";

import { useQuery } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import { listSaleOrderSellersApi } from "@/features/sales-orders/api/sale-order-sellers.service";
import { saleOrderKeys } from "@/features/sales-orders/hooks/query-keys";

export function useSaleOrderSellersQuery() {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: saleOrderKeys.sellers(scope),
    queryFn: listSaleOrderSellersApi,
    enabled: ready,
    staleTime: 5 * 60 * 1000,
  });
}
