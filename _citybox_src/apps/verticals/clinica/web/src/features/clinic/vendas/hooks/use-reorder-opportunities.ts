import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { salesService, type Opportunity } from "../services/sales.service";
import { useClinicId } from "../lib/use-clinic-id";
import { salesQueryKeys } from "./query-keys";

export type ReorderOpportunityItem = {
  id: string;
  stageId: string;
  sortOrder: number;
};

type ReorderContext = {
  previousQueries: Array<[QueryKey, Opportunity[] | undefined]>;
};

function applyReorder(
  old: Opportunity[] | undefined,
  items: ReorderOpportunityItem[],
): Opportunity[] | undefined {
  if (!old || !Array.isArray(old)) return old;
  const byId = new Map(items.map((item) => [item.id, item]));
  return old
    .map((opp) => {
      const patch = byId.get(opp.id);
      if (!patch) return opp;
      return { ...opp, stageId: patch.stageId, sortOrder: patch.sortOrder };
    })
    .sort((a, b) => {
      if (a.stageId !== b.stageId) return a.stageId.localeCompare(b.stageId);
      return a.sortOrder - b.sortOrder;
    });
}

/** Persiste a ordem dos cards no kanban (mesmo estágio ou após move). */
export function useReorderOpportunities() {
  const queryClient = useQueryClient();
  const { clinicId } = useClinicId();

  return useMutation<void, Error, ReorderOpportunityItem[], ReorderContext>({
    mutationFn: (items) => salesService.reorderOpportunities(clinicId, items),
    onMutate: async (items) => {
      await queryClient.cancelQueries({
        queryKey: salesQueryKeys.opportunities(clinicId),
      });

      const previousQueries = queryClient.getQueriesData<Opportunity[]>({
        queryKey: salesQueryKeys.opportunities(clinicId),
      });

      queryClient.setQueriesData<Opportunity[]>(
        { queryKey: salesQueryKeys.opportunities(clinicId) },
        (old) => applyReorder(old, items),
      );

      return { previousQueries };
    },
    onError: (_err, _variables, context) => {
      context?.previousQueries.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
  });
}
