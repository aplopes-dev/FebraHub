"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import {
  getCustomerNfeFiscalInfoApi,
  issueNfeApi,
  listEligibleSaleOrdersApi,
  listNfeIssuancesApi,
  previewNfeIssuanceApi,
} from "../api/nfe-issuance.service";
import type { IssueNfePayload } from "../api/nfe-issuance.dto";

const KEY = "nfe-issuances";
const DEBOUNCE_MS = 400;

export function nfeIssuanceKeys(scope: string) {
  return {
    all: ["comercio", KEY, scope] as const,
    list: ["comercio", KEY, scope, "list"] as const,
  };
}

/**
 * Debounce embutido no hook (molde `useBankAccountList`) — achado do
 * react-reviewer: `staleTime` sozinho não evita 1 requisição por tecla
 * digitada, e o comentário anterior presumia (incorretamente) que quem
 * chamasse este hook já faria o debounce.
 */
export function useEligibleSaleOrdersQuery(search: string) {
  const { scope, ready } = useCatalogScope();
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  return useQuery({
    queryKey: ["comercio", KEY, scope, "eligible-sale-orders", debouncedSearch],
    queryFn: () => listEligibleSaleOrdersApi(debouncedSearch),
    enabled: ready,
  });
}

export function useNfePreviewQuery(saleOrderId: string | null) {
  const { scope, ready } = useCatalogScope();
  return useQuery({
    queryKey: ["comercio", KEY, scope, "preview", saleOrderId ?? ""],
    queryFn: () => previewNfeIssuanceApi(saleOrderId as string),
    enabled: ready && Boolean(saleOrderId),
  });
}

/**
 * Resolvedor próprio da NF-e (spec erp/028) — não reusa
 * `useCustomerFiscalInfoQuery` de `nfse-issuance` (sem endereço); ver
 * `customer-nfe-fiscal-info.dto.ts` para o porquê.
 */
export function useCustomerNfeFiscalInfoQuery(customerId: string | null) {
  const { scope, ready } = useCatalogScope();
  return useQuery({
    queryKey: ["comercio", KEY, scope, "customer-nfe-fiscal", customerId ?? ""],
    queryFn: () => getCustomerNfeFiscalInfoApi(customerId as string),
    enabled: ready && Boolean(customerId),
  });
}

export function useNfeIssuancesQuery() {
  const { scope, ready } = useCatalogScope();
  return useQuery({
    queryKey: nfeIssuanceKeys(scope).list,
    queryFn: listNfeIssuancesApi,
    enabled: ready,
  });
}

export function useIssueNfeMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: IssueNfePayload) => issueNfeApi(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: nfeIssuanceKeys(scope).all }),
  });
}
