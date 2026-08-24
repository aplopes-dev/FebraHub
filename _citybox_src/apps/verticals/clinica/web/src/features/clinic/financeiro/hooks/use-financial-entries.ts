import { useQuery } from "@tanstack/react-query";
import { useClinicId } from "@/features/clinic/estoque/lib/use-clinic-id";
import {
  financialService,
  type ListEntriesParams,
} from "../services/financial.service";

export const FINANCIAL_ENTRIES_KEY = ["financial-entries"] as const;

export function useFinancialEntries(params: ListEntriesParams) {
  const { clinicId, isReady } = useClinicId();

  return useQuery({
    queryKey: [...FINANCIAL_ENTRIES_KEY, clinicId, params],
    queryFn: () => financialService.entries.list(clinicId, params),
    enabled: isReady && !!(params.startDate || params.endDate),
    staleTime: 0,
    gcTime: 0,
  });
}
