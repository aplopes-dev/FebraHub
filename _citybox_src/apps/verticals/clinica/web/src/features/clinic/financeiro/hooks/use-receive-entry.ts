import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useClinicId } from "@/features/clinic/estoque/lib/use-clinic-id";
import { commissionsKeys } from "../comissoes/hooks/use-commissions-queries";
import {
  financialService,
  type ReceiveEntryPayload,
} from "../services/financial.service";
import { invalidateClinicDashboardQueries } from "@/features/clinic/modules/dashboard/lib/invalidate-clinic-dashboard-queries";
import { FINANCIAL_ENTRIES_KEY } from "./use-financial-entries";
import { FINANCIAL_STATS_KEY } from "./use-financial-stats";

export function useReceiveEntry() {
  const queryClient = useQueryClient();
  const { clinicId } = useClinicId();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReceiveEntryPayload }) =>
      financialService.entries.receive(clinicId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCIAL_ENTRIES_KEY });
      queryClient.invalidateQueries({ queryKey: FINANCIAL_STATS_KEY });
      invalidateClinicDashboardQueries(queryClient);
      // Receive gera accruals — lista Em aberto precisa atualizar
      if (clinicId) {
        void queryClient.invalidateQueries({
          queryKey: commissionsKeys.all(clinicId),
        });
      }
    },
  });
}
