import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  salesService,
  type Funnel,
  type UpdateFunnelData,
} from "../services/sales.service";
import { useClinicId } from "../lib/use-clinic-id";
import { salesQueryKeys } from "./query-keys";

/** Atualiza um funil (nome e/ou etapas). */
export function useUpdateFunnel() {
  const queryClient = useQueryClient();
  const { clinicId } = useClinicId();

  return useMutation<Funnel, Error, { id: string; data: UpdateFunnelData }>({
    mutationFn: ({ id, data }) =>
      salesService.updateFunnel(clinicId, id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(salesQueryKeys.funnel(clinicId, updated.id), updated);
      queryClient.setQueriesData<Funnel[]>(
        { queryKey: salesQueryKeys.funnels(clinicId) },
        (old) => {
          if (!old || !Array.isArray(old)) return old;
          return old.map((funnel) =>
            funnel.id === updated.id ? updated : funnel,
          );
        },
      );
      void queryClient.invalidateQueries({
        queryKey: salesQueryKeys.funnels(clinicId),
      });
    },
  });
}
