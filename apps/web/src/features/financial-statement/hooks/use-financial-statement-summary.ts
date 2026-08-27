"use client";

import { useQuery } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import { getFinancialStatementSummaryApi } from "@/features/financial-statement/api/financial-statement.service";
import { financialStatementKeys } from "@/features/financial-statement/hooks/query-keys";
import type { FinancialStatementFilters } from "@/features/financial-statement/types/financial-statement";

/**
 * Cards de resumo — recebe `search`/`filters` de fora (mesmos valores de
 * `use-financial-statement-list`) em vez de duplicar o estado, garantindo
 * que os cards somem exatamente o conjunto filtrado da lista (FR-008).
 */
export function useFinancialStatementSummary(params: {
  search: string;
  filters: FinancialStatementFilters;
}) {
  const { scope, ready } = useCatalogScope();

  const query = useQuery({
    queryKey: financialStatementKeys.summary(scope, params),
    queryFn: () => getFinancialStatementSummaryApi(params),
    enabled: ready,
  });

  return {
    summary: query.data ?? { receivable: 0, payable: 0, net: 0 },
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
