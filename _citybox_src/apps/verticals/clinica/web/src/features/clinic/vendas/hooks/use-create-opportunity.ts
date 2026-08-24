import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  salesService,
  type CreateOpportunityData,
  type Opportunity,
} from "../services/sales.service";
import { useClinicId } from "../lib/use-clinic-id";
import { salesQueryKeys } from "./query-keys";

/** Cria uma nova oportunidade. */
export function useCreateOpportunity() {
  const queryClient = useQueryClient();
  const { clinicId } = useClinicId();

  return useMutation<Opportunity, Error, CreateOpportunityData>({
    mutationFn: (data) => salesService.createOpportunity(clinicId, data),
    onSuccess: (created) => {
      queryClient.setQueriesData<Opportunity[]>(
        { queryKey: salesQueryKeys.opportunities(clinicId) },
        (old) => {
          if (!old || !Array.isArray(old)) return [created];
          if (old.some((opp) => opp.id === created.id)) return old;
          return [created, ...old];
        },
      );
      void queryClient.invalidateQueries({
        queryKey: salesQueryKeys.opportunities(clinicId),
      });
    },
  });
}
