"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import {
  getFiscalDefaultTaxesApi,
  listFiscalGroupsApi,
  upsertFiscalDefaultTaxesApi,
} from "../api/fiscal-default-taxes.service";
import type { UpsertFiscalDefaultTaxesPayload } from "../api/fiscal-default-taxes.dto";

/** Chave do padrão fiscal — escopada por org/unidade (evita vazamento entre lojas). */
export function fiscalDefaultTaxesKey(scope: string) {
  return ["comercio", "fiscal-default-taxes", scope] as const;
}

/** Chave compartilhada dos grupos (herança em fiscal-parameters reusa). */
export function fiscalGroupsKey(scope: string) {
  return ["comercio", "fiscal-groups", scope] as const;
}

/** Todos os grupos fiscais da org (a aba filtra por tributo no cliente). */
export function useFiscalGroupsQuery() {
  const { scope, ready } = useCatalogScope();
  return useQuery({
    queryKey: fiscalGroupsKey(scope),
    queryFn: () => listFiscalGroupsApi(),
    enabled: ready,
  });
}

export function useFiscalDefaultTaxesQuery() {
  const { scope, ready } = useCatalogScope();
  return useQuery({
    queryKey: fiscalDefaultTaxesKey(scope),
    queryFn: getFiscalDefaultTaxesApi,
    enabled: ready,
  });
}

export function useFiscalDefaultTaxesMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertFiscalDefaultTaxesPayload) =>
      upsertFiscalDefaultTaxesApi(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: fiscalDefaultTaxesKey(scope),
      }),
  });
}
