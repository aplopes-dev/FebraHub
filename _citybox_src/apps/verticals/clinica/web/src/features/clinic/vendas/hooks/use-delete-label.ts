import { useMutation, useQueryClient } from "@tanstack/react-query";
import { labelService } from "../services/sales.service";
import { useClinicId } from "../lib/use-clinic-id";
import { salesQueryKeys } from "./query-keys";

/** Exclui um rótulo (nullifica nas oportunidades). */
export function useDeleteLabel() {
  const queryClient = useQueryClient();
  const { clinicId } = useClinicId();

  return useMutation<void, Error, string>({
    mutationFn: (id) => labelService.deleteLabel(clinicId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: salesQueryKeys.labels(clinicId),
      });
      void queryClient.invalidateQueries({
        queryKey: salesQueryKeys.opportunities(clinicId),
      });
    },
  });
}
