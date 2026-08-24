"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import { useFiscalCompany } from "@/features/facilita-nfe/hooks/use-fiscal-company";
import { getFiscalCompanyByIdApi } from "@/features/fiscal-settings/api/fiscal-settings.service";
import { fiscalCompanySettingsKey } from "@/features/fiscal-settings/hooks/use-fiscal-settings";
import { listCertificatesApi } from "@/features/fiscal-certificate/api/fiscal-certificate.service";
import {
  getPosFiscalSettingsApi,
  upsertPosFiscalSettingsApi,
} from "../api/pos-fiscal-type.service";
import type { UpsertPosFiscalSettingsPayload } from "../api/pos-fiscal-type.dto";

/**
 * Escopada por organização (BUG-04, 2026-08-13) — mesmo padrão das features
 * fiscais irmãs (`fiscal-default-taxes`, `fiscal-icms-group`). Sem o escopo
 * na chave, trocar de empresa no cabeçalho servia do cache a configuração da
 * empresa anterior: num campo que decide qual documento fiscal o PDV emite,
 * isso é vazamento de tenancy, não só UX desatualizada.
 */
function configKey(scope: string) {
  return ["comercio", "pos-fiscal-settings", scope] as const;
}

/**
 * Reúne o que a aba precisa: a config (erp-api), e — da fiscal-api, pelo
 * `companyId` — se o Emitente tem CSC (bloqueia Modelo 65) e certificado válido
 * (só avisa). Cada leitura na sua fonte.
 */
export function usePosFiscalType() {
  const { scope, ready } = useCatalogScope();
  const {
    companyId,
    isCompanyMissing,
    isLoading: companyLoading,
    isError: companyIsError,
  } = useFiscalCompany();

  const configQuery = useQuery({
    queryKey: configKey(scope),
    // BUG-04: sem `enabled`, a query disparava antes do `OrganizationProvider`
    // publicar o escopo em `lib/api/active-scope.ts` — 400 "Header
    // X-Organization-Id obrigatório" desperdiçado, salvo só pelo retry.
    enabled: ready,
    queryFn: getPosFiscalSettingsApi,
  });

  const companyQuery = useQuery({
    // Mesma chave da aba "Configurações gerais" — assim gravar o CSC lá invalida
    // este cache também (evita bloqueio stale do Modelo 65).
    queryKey: companyId
      ? fiscalCompanySettingsKey(companyId)
      : (["fiscal", "company-settings"] as const),
    queryFn: () => getFiscalCompanyByIdApi(companyId as string),
    enabled: Boolean(companyId),
  });

  const certificatesQuery = useQuery({
    queryKey: ["fiscal", "company-certificates", companyId],
    queryFn: () => listCertificatesApi(companyId as string),
    enabled: Boolean(companyId),
  });

  return {
    config: configQuery.data ?? null,
    cscConfigured: companyQuery.data?.cscConfigured ?? false,
    hasValidCertificate: (certificatesQuery.data ?? []).some(
      (cert) => cert.status === "VALID",
    ),
    isCompanyMissing,
    isLoading:
      !ready ||
      companyLoading ||
      configQuery.isLoading ||
      (Boolean(companyId) &&
        (companyQuery.isLoading || certificatesQuery.isLoading)),
    // Falha de resolução do Emitente também é erro — não confundir com "sem
    // certificado / sem CSC ainda" (que exigiria isSuccess).
    isError: configQuery.isError || companyIsError,
  };
}

/** Mutation de gravação da config. */
export function usePosFiscalTypeMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertPosFiscalSettingsPayload) =>
      upsertPosFiscalSettingsApi(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: configKey(scope) }),
  });
}
