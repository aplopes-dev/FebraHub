import { useMutation, useQueryClient } from "@tanstack/react-query";
import { salesService } from "../services/sales.service";
import { useClinicId } from "../lib/use-clinic-id";
import { salesQueryKeys } from "./query-keys";

/** Exclui um funil (cascade oportunidades). */
export function useDeleteFunnel() {
  const queryClient = useQueryClient();
  const { clinicId } = useClinicId();

  return useMutation<void, Error, string>({
    mutationFn: (id) => salesService.deleteFunnel(clinicId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: salesQueryKeys.funnels(clinicId),
      });
      void queryClient.invalidateQueries({
        queryKey: salesQueryKeys.opportunities(clinicId),
      });
    },
  });
}
