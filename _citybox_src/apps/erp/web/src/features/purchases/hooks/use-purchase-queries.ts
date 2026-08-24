"use client";

import { useQuery } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import {
  getPurchaseByIdApi,
  listPurchasesApi,
} from "@/features/purchases/api/purchases.service";
import { purchaseKeys } from "@/features/purchases/hooks/query-keys";
import type { PurchaseListParams } from "@/features/purchases/types/purchase";

export function usePurchasesQuery(params: PurchaseListParams) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: purchaseKeys.list(scope, params),
    // `ready` evita disparar antes de a empresa/unidade ativa ser resolvida —
    // sem escopo, a API responde 400.
    queryFn: () => listPurchasesApi(params),
    enabled: ready,
  });
}

export function usePurchaseQuery(id: string) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: purchaseKeys.detail(scope, id),
    queryFn: () => getPurchaseByIdApi(id),
    enabled: ready && Boolean(id),
    retry: false, // 404 é resposta legítima ("compra não encontrada")
  });
}
