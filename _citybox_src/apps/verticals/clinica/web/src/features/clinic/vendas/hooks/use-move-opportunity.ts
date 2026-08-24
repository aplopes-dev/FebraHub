import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { salesService, type Opportunity } from "../services/sales.service";
import { useClinicId } from "../lib/use-clinic-id";
import { salesQueryKeys } from "./query-keys";

type MoveOpportunityContext = {
  previousQueries: Array<[QueryKey, Opportunity[] | undefined]>;
};

function patchOpportunityLists(
  old: Opportunity[] | undefined,
  id: string,
  patch: Partial<Opportunity> | Opportunity,
): Opportunity[] | undefined {
  if (!old || !Array.isArray(old)) return old;
  return old.map((opp) => (opp.id === id ? { ...opp, ...patch } : opp));
}

/** Move uma oportunidade para outra etapa (drag and drop) com atualização otimista. */
export function useMoveOpportunity() {
  const queryClient = useQueryClient();
  const { clinicId } = useClinicId();

  return useMutation<
    Opportunity,
    Error,
    { id: string; stageId: string; sortOrder?: number },
    MoveOpportunityContext
  >({
    mutationFn: ({ id, stageId, sortOrder }) =>
      salesService.moveOpportunity(clinicId, id, stageId, sortOrder),
    onMutate: async ({ id, stageId, sortOrder }) => {
      await queryClient.cancelQueries({
        queryKey: salesQueryKeys.opportunities(clinicId),
      });

      const previousQueries = queryClient.getQueriesData<Opportunity[]>({
        queryKey: salesQueryKeys.opportunities(clinicId),
      });

      queryClient.setQueriesData<Opportunity[]>(
        { queryKey: salesQueryKeys.opportunities(clinicId) },
        (old) =>
          patchOpportunityLists(old, id, {
            stageId,
            ...(sortOrder !== undefined ? { sortOrder } : {}),
          }),
      );

      return { previousQueries };
    },
    onSuccess: (updated) => {
      // Persiste o resultado no cache — sem invalidate da listagem (evita race/snapback).
      queryClient.setQueriesData<Opportunity[]>(
        { queryKey: salesQueryKeys.opportunities(clinicId) },
        (old) => patchOpportunityLists(old, updated.id, updated),
      );
      queryClient.setQueryData(
        salesQueryKeys.opportunity(clinicId, updated.id),
        updated,
      );
    },
    onError: (_err, _variables, context) => {
      context?.previousQueries.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: (_data, _err, variables) => {
      if (variables?.id) {
        void queryClient.invalidateQueries({
          queryKey: salesQueryKeys.opportunityHistory(clinicId, variables.id),
        });
      }
    },
  });
}
