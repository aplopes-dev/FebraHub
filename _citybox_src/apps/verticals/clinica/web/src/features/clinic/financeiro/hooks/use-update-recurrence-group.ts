import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useClinicId } from "@/features/clinic/estoque/lib/use-clinic-id";
import {
  financialService,
  type RecurrenceScope,
  type UpdateRecurrenceGroupPayload,
} from "../services/financial.service";
import { invalidateClinicDashboardQueries } from "@/features/clinic/modules/dashboard/lib/invalidate-clinic-dashboard-queries";
import { FINANCIAL_ENTRIES_KEY } from "./use-financial-entries";
import { FINANCIAL_STATS_KEY } from "./use-financial-stats";

export type { RecurrenceScope };

export function useUpdateRecurrenceGroup() {
  const queryClient = useQueryClient();
  const { clinicId } = useClinicId();

  return useMutation({
    mutationFn: ({
      id,
      groupId,
      data,
    }: {
      id: string;
      groupId: string;
      data: UpdateRecurrenceGroupPayload;
    }) =>
      financialService.entries.updateRecurrenceGroup(
        clinicId,
        { entryId: id, groupId },
        data,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCIAL_ENTRIES_KEY });
      queryClient.invalidateQueries({ queryKey: FINANCIAL_STATS_KEY });
      invalidateClinicDashboardQueries(queryClient);
    },
  });
}
