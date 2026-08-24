import { useQuery } from "@tanstack/react-query";

import { useClinicId } from "@/features/clinic/estoque/lib/use-clinic-id";
import { useFinancialAccounts } from "./use-financial-accounts";
import {
  buildTransactionsApiParams,
  buildTransactionsByMethodApiParams,
  statsFromPaymentMethodSummaries,
  toPaymentMethodSummary,
} from "../lib/build-transactions-api-params";
import { financialService } from "../services/financial.service";
import type { TransactionsFilters } from "../types";

export const TRANSACTIONS_KEY = ["clinic-transactions"] as const;

export type TransactionsQueryParams = {
  startDate: string;
  endDate: string;
  filters: TransactionsFilters;
  page?: number;
  perPage?: number;
};

export function useTransactionsList(
  params: TransactionsQueryParams & { enabled?: boolean },
) {
  const { clinicId, isReady } = useClinicId();
  const { enabled = true, ...queryParams } = params;
  const apiParams = buildTransactionsApiParams(queryParams);

  return useQuery({
    queryKey: [...TRANSACTIONS_KEY, "list", clinicId, apiParams],
    queryFn: () => financialService.entries.list(clinicId, apiParams),
    enabled:
      enabled &&
      isReady &&
      Boolean(queryParams.startDate && queryParams.endDate),
    staleTime: 0,
    gcTime: 0,
  });
}

export function useTransactionsByMethod(
  params: Omit<TransactionsQueryParams, "page" | "perPage">,
) {
  const { clinicId, isReady } = useClinicId();
  const apiParams = buildTransactionsByMethodApiParams(params);

  return useQuery({
    queryKey: [...TRANSACTIONS_KEY, "by-method", clinicId, apiParams],
    queryFn: async () => {
      const rows = await financialService.entries.listByPaymentMethod(
        clinicId,
        apiParams,
      );
      return rows.map(toPaymentMethodSummary);
    },
    enabled:
      isReady && Boolean(params.startDate && params.endDate),
    staleTime: 0,
    gcTime: 0,
  });
}

/** KPIs das Transações — recalculados a partir do agregador por meio. */
export function useTransactionsStats(
  params: Omit<TransactionsQueryParams, "page" | "perPage">,
) {
  const byMethod = useTransactionsByMethod(params);

  return {
    ...byMethod,
    data: byMethod.data
      ? statsFromPaymentMethodSummaries(byMethod.data)
      : undefined,
  };
}

export function useTransactionsAccounts() {
  return useFinancialAccounts({ includeInactive: false });
}
