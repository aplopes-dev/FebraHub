"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import {
  getCustomerFiscalInfoApi,
  issueNfseApi,
  listNfseIssuancesApi,
} from "../api/nfse-issuance.service";
import type { IssueNfsePayload } from "../api/nfse-issuance.dto";

const KEY = "nfse-issuances";

export function nfseIssuanceKeys(scope: string) {
  return {
    all: ["api", KEY, scope] as const,
    list: ["api", KEY, scope, "list"] as const,
  };
}

export function useNfseIssuancesQuery() {
  const { scope, ready } = useCatalogScope();
  return useQuery({
    queryKey: nfseIssuanceKeys(scope).list,
    queryFn: listNfseIssuancesApi,
    enabled: ready,
  });
}

export function useCustomerFiscalInfoQuery(customerId: string | null) {
  const { scope, ready } = useCatalogScope();
  return useQuery({
    queryKey: ["api", KEY, scope, "customer-fiscal", customerId ?? ""],
    queryFn: () => getCustomerFiscalInfoApi(customerId as string),
    enabled: ready && Boolean(customerId),
  });
}

export function useIssueNfseMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: IssueNfsePayload) => issueNfseApi(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: nfseIssuanceKeys(scope).all }),
  });
}
