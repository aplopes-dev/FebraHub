"use client";

import { useQuery } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import {
  getCardContractById,
  listCardContracts,
  listPaymentMethods,
} from "@/features/card-contracts/api/card-contracts.service";
import { cardContractKeys } from "@/features/card-contracts/hooks/query-keys";
import type { CardContractListParams } from "@/features/card-contracts/types/card-contract";

export function useCardContractsQuery(params: CardContractListParams) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: cardContractKeys.list(scope, params),
    queryFn: () => listCardContracts(params),
    enabled: ready,
  });
}

export function useCardContractQuery(id: string) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: cardContractKeys.detail(scope, id),
    queryFn: () => getCardContractById(id),
    enabled: ready && Boolean(id),
    retry: false,
  });
}

export function usePaymentMethodsQuery(contractId: string) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: cardContractKeys.paymentMethods(scope, contractId),
    queryFn: () => listPaymentMethods(contractId),
    enabled: ready && Boolean(contractId),
  });
}
