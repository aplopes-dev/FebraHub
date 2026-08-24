import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useClinicId } from "@/features/clinic/estoque/lib/use-clinic-id";
import {
  financialService,
  type PayEntryPayload,
} from "../services/financial.service";
import { invalidateClinicDashboardQueries } from "@/features/clinic/modules/dashboard/lib/invalidate-clinic-dashboard-queries";
import { FINANCIAL_ENTRIES_KEY } from "./use-financial-entries";
import { FINANCIAL_STATS_KEY } from "./use-financial-stats";

export function usePayEntry() {
  const queryClient = useQueryClient();
  const { clinicId } = useClinicId();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PayEntryPayload }) =>
      financialService.entries.pay(clinicId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCIAL_ENTRIES_KEY });
      queryClient.invalidateQueries({ queryKey: FINANCIAL_STATS_KEY });
      invalidateClinicDashboardQueries(queryClient);
    },
  });
}
