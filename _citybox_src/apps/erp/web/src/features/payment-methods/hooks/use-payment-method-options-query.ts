"use client";

import { useQuery } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import { listPaymentMethodOptionsApi } from "@/features/payment-methods/api/payment-methods.service";
import { paymentMethodKeys } from "@/features/payment-methods/hooks/query-keys";

/**
 * Opções `{id, name}` das formas de pagamento ativas — alimenta o select de
 * `financial-entries`/`transfer-dialog` (spec `007-financeiro-ajustes-ui`
 * FR-006/FR-022, única fonte de dado no módulo, sem enum fixo).
 */
export function usePaymentMethodOptionsQuery() {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: paymentMethodKeys.options(scope),
    queryFn: listPaymentMethodOptionsApi,
    enabled: ready,
    staleTime: 5 * 60 * 1000,
  });
}
