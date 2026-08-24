import { useMutation, useQueryClient } from "@tanstack/react-query";
import { salesService } from "../services/sales.service";
import { useClinicId } from "../lib/use-clinic-id";
import { salesQueryKeys } from "./query-keys";

/** Adiciona comentário ao histórico da oportunidade. */
export function useAddComment() {
  const queryClient = useQueryClient();
  const { clinicId } = useClinicId();

  return useMutation({
    mutationFn: ({
      opportunityId,
      content,
    }: {
      opportunityId: string;
      content: string;
    }) => salesService.addComment(clinicId, opportunityId, content),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: salesQueryKeys.opportunityHistory(
          clinicId,
          variables.opportunityId,
        ),
      });
    },
  });
}
