import { useQuery } from "@tanstack/react-query";
import { useClinicId } from "@/features/clinic/estoque/lib/use-clinic-id";
import {
  financialService,
  type StatsParams,
} from "../services/financial.service";

export const FINANCIAL_STATS_KEY = ["financial-stats"] as const;

export function useFinancialStats(
  params: StatsParams,
  options?: { enabled?: boolean },
) {
  const { clinicId, isReady } = useClinicId();

  return useQuery({
    queryKey: [...FINANCIAL_STATS_KEY, clinicId, params],
    queryFn: () => financialService.entries.stats(clinicId, params),
    enabled:
      isReady &&
      !!(params.startDate || params.endDate) &&
      (options?.enabled ?? true),
    staleTime: 0,
    gcTime: 0,
  });
}
