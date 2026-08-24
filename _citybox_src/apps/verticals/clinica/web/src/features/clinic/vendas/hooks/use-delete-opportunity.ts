import { useMutation, useQueryClient } from "@tanstack/react-query";
import { salesService } from "../services/sales.service";
import { useClinicId } from "../lib/use-clinic-id";
import { salesQueryKeys } from "./query-keys";

/** Exclui uma oportunidade. */
export function useDeleteOpportunity() {
  const queryClient = useQueryClient();
  const { clinicId } = useClinicId();

  return useMutation<void, Error, string>({
    mutationFn: (id) => salesService.deleteOpportunity(clinicId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: salesQueryKeys.opportunities(clinicId),
      });
    },
  });
}
