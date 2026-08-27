"use client";

import { useQuery } from "@tanstack/react-query";
import { useOrganization } from "@/lib/organization-context";
import { getCurrentOrganizationApi } from "@/features/company-settings/api/organization-current.service";
import { findFiscalCompanyByCnpjApi } from "@/features/facilita-nfe/api/facilita-nfe.service";
import { facilitaNfeKeys } from "@/features/facilita-nfe/hooks/query-keys";

const STALE_TIME_MS = 5 * 60 * 1000;

/**
 * Resolve o Emitente fiscal (`companyId` de `fiscal-documents`) a partir do
 * CNPJ da organização ativa (research.md §2). Dois passos, os dois com
 * `staleTime` alto — o vínculo Emitente↔Organização não muda a cada render:
 *
 * 1. `GET /v1/organizations/current` (API) → `document` (CNPJ)
 * 2. `GET /v1/companies?cnpj=` (fiscal-api) → `Company.id`
 *
 * Restaurado em 2026-08-14 (spec erp/023): o merge de `main` (`ee698de21`)
 * removeu este hook junto com o refactor de M2M por vertical, mas manteve
 * `/api/proxy/fiscal`, `fiscal-client.ts` e as 6 telas (`fiscal-settings`,
 * `fiscal-certificate`, `fiscal-invoice-series`, `pos-fiscal-document-type`,
 * `nfse-issuance`, `fiscal-pis-cofins-group`) que dependem exatamente deste
 * contrato — a remoção quebrou o build sem migrar os consumidores. Restaurado
 * como estava até essas telas serem migradas para o padrão API-primeiro
 * (`resolve-fiscal-company.use-case.ts`) que o refactor introduziu.
 */
export function useFiscalCompany() {
  const { organizationId, hydrated } = useOrganization();

  const organizationQuery = useQuery({
    queryKey: ["api", "organization-current", organizationId],
    queryFn: getCurrentOrganizationApi,
    enabled: hydrated && Boolean(organizationId),
    staleTime: STALE_TIME_MS,
  });

  const cnpj = organizationQuery.data?.document ?? null;

  const companyQuery = useQuery({
    queryKey: facilitaNfeKeys.company(organizationId),
    queryFn: () => findFiscalCompanyByCnpjApi(cnpj as string),
    enabled: Boolean(cnpj),
    staleTime: STALE_TIME_MS,
  });

  return {
    companyId: companyQuery.data?.id ?? null,
    /** `true` quando a busca terminou e não existe Emitente fiscal para essa organização. */
    isCompanyMissing:
      organizationQuery.isSuccess &&
      companyQuery.isSuccess &&
      companyQuery.data === null,
    isLoading: organizationQuery.isLoading || companyQuery.isLoading,
    isError: organizationQuery.isError || companyQuery.isError,
  };
}
