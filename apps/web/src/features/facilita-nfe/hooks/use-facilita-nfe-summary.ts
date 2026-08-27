"use client";

import { useQuery } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import { getIssuedFiscalDocumentsSummaryApi } from "@/features/facilita-nfe/api/facilita-nfe.service";
import { facilitaNfeKeys } from "@/features/facilita-nfe/hooks/query-keys";
import type { FacilitaNfeIssuedFilters } from "@/features/facilita-nfe/types/fiscal-document";

/**
 * Cards de totais da aba "Emitido" — recebe `search`/`filters` de
 * fora (mesmos valores de `use-facilita-nfe-list`), garantindo que os cards
 * somem exatamente o conjunto filtrado da lista (FR-003).
 *
 * "Manifestações finais"/"Não manifestadas" **não** fazem parte desta query —
 * são renderizados sempre zerados pelo componente de cards (ver
 * `research.md` §3.3).
 */
export function useFacilitaNfeSummary(params: {
  search: string;
  filters: FacilitaNfeIssuedFilters;
}) {
  const { scope } = useCatalogScope();

  const query = useQuery({
    queryKey: facilitaNfeKeys.summary(scope, params),
    queryFn: () => getIssuedFiscalDocumentsSummaryApi(params),
    retry: false,
  });

  return {
    summary: query.data ?? { total: 0, authorized: 0, cancelled: 0 },
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
