"use client";

import { useQuery } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import { listBankAccountOptionsApi } from "@/features/bank-accounts/api/bank-accounts.service";
import { bankAccountKeys } from "@/features/bank-accounts/hooks/query-keys";

export function useBankAccountOptionsQuery() {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: bankAccountKeys.options(scope),
    queryFn: listBankAccountOptionsApi,
    enabled: ready,
    staleTime: 5 * 60 * 1000,
  });
}
