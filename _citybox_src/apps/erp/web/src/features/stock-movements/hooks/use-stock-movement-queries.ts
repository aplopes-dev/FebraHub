"use client";

import { useQuery } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import {
  getStockMovementByIdApi,
  listAllStockBalanceApi,
  listMovementCategoryOptionsApi,
  listProductStockMovementsApi,
  listStockBalanceApi,
  listStockMovementsApi,
  type StockBalanceListParams,
} from "@/features/stock-movements/api/stock-movements.service";
import {
  stockBalanceKeys,
  stockMovementKeys,
} from "@/features/stock-movements/hooks/query-keys";
import type {
  StockMovementListParams,
  StockMovementType,
} from "@/features/stock-movements/types/stock-movement";

export function useStockMovementsQuery(params: StockMovementListParams) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: stockMovementKeys.list(scope, params),
    queryFn: () => listStockMovementsApi(params),
    enabled: ready,
  });
}

export function useStockMovementQuery(id: string) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: stockMovementKeys.detail(scope, id),
    queryFn: () => getStockMovementByIdApi(id),
    enabled: ready && Boolean(id),
    retry: false,
  });
}

export function useMovementCategoryOptionsQuery(type: StockMovementType) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: stockMovementKeys.categoryOptions(scope, type),
    queryFn: () => listMovementCategoryOptionsApi(type),
    enabled: ready,
  });
}

export function useStockBalanceQuery(params: StockBalanceListParams) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: stockBalanceKeys.list(scope, params),
    queryFn: () => listStockBalanceApi(params),
    enabled: ready && Boolean(params.stockId),
  });
}

/**
 * Balanço COMPLETO do depósito (todas as páginas).
 *
 * Diferente de `useStockBalanceQuery`, que serve uma tela paginada: aqui o
 * saldo é usado como fonte de verdade para uma decisão de escrita (inventário),
 * então uma página truncada produziria ajuste errado.
 */
export function useFullStockBalanceQuery(stockId: string) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: stockBalanceKeys.full(scope, stockId),
    queryFn: () => listAllStockBalanceApi(stockId),
    enabled: ready && Boolean(stockId),
  });
}

export function useProductStockMovementsQuery(
  stockId: string,
  productId: string,
  enabled: boolean,
) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: stockBalanceKeys.productMovements(scope, stockId, productId),
    queryFn: () => listProductStockMovementsApi(stockId, productId),
    enabled: ready && enabled && Boolean(stockId) && Boolean(productId),
  });
}
