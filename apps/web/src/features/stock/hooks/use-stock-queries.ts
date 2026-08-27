"use client";

import { useQuery } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import {
  getStockByIdApi,
  listAllStocksApi,
  listStocksApi,
} from "@/features/stock/api/stocks.service";
import { stockKeys } from "@/features/stock/hooks/query-keys";
import type { StockListParams } from "@/features/stock/types/stock";

export function useStocksQuery(params: StockListParams) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: stockKeys.list(scope, params),
    queryFn: () => listStocksApi(params),
    enabled: ready,
  });
}

/**
 * Todos os depósitos, para SELECTS. Use `useStocksQuery` quando a tela
 * realmente pagina.
 */
export function useAllStocksQuery() {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: stockKeys.allItems(scope),
    queryFn: () => listAllStocksApi(),
    enabled: ready,
  });
}

export function useStockQuery(id: string) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: stockKeys.detail(scope, id),
    queryFn: () => getStockByIdApi(id),
    enabled: ready && Boolean(id),
    retry: false,
  });
}
