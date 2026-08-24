"use client";

import { useQuery } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import { listPaymentMethodsApi } from "@/features/payment-methods/api/payment-methods.service";
import { paymentMethodKeys } from "@/features/payment-methods/hooks/query-keys";

/**
 * Todas as formas de pagamento ativas (sistema + próprias) — alimenta tanto a
 * tela de Configurações (agrupada em duas listas, ver
 * `selectPaymentMethodGroups`) quanto, futuramente, o select de lançamentos.
 */
export function usePaymentMethodsQuery() {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: paymentMethodKeys.list(scope),
    queryFn: listPaymentMethodsApi,
    enabled: ready,
  });
}
