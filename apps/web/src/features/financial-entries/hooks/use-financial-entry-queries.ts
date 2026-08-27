"use client";

import { useQuery } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import {
  findFinancialEntryByIdApi,
  listFinancialEntriesApi,
} from "@/features/financial-entries/api/financial-entries.service";
import { financialEntryKeys } from "@/features/financial-entries/hooks/query-keys";
import type { FinancialEntryListParams } from "@/features/financial-entries/types/financial-entry";

export function useFinancialEntriesQuery(params: FinancialEntryListParams) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: financialEntryKeys.list(scope, params),
    queryFn: () => listFinancialEntriesApi(params),
    enabled: ready,
  });
}

export function useFinancialEntryQuery(id: string) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: financialEntryKeys.detail(scope, id),
    queryFn: () => findFinancialEntryByIdApi(id),
    enabled: ready && Boolean(id),
    retry: false,
  });
}
