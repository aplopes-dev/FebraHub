import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  salesService,
  type Opportunity,
  type UpdateOpportunityData,
} from "../services/sales.service";
import { useClinicId } from "../lib/use-clinic-id";
import { salesQueryKeys } from "./query-keys";

/** Atualiza campos de uma oportunidade. */
export function useUpdateOpportunity() {
  const queryClient = useQueryClient();
  const { clinicId } = useClinicId();

  return useMutation<
    Opportunity,
    Error,
    { id: string; data: UpdateOpportunityData }
  >({
    mutationFn: ({ id, data }) =>
      salesService.updateOpportunity(clinicId, id, data),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: salesQueryKeys.opportunities(clinicId),
      });
      void queryClient.invalidateQueries({
        queryKey: salesQueryKeys.opportunity(clinicId, variables.id),
      });
      void queryClient.invalidateQueries({
        queryKey: salesQueryKeys.opportunityHistory(clinicId, variables.id),
      });
    },
  });
}
