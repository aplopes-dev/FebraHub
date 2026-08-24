import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  labelService,
  type Label,
  type UpdateLabelData,
} from "../services/sales.service";
import { useClinicId } from "../lib/use-clinic-id";
import { salesQueryKeys } from "./query-keys";

/** Atualiza um rótulo. */
export function useUpdateLabel() {
  const queryClient = useQueryClient();
  const { clinicId } = useClinicId();

  return useMutation<Label, Error, { id: string; data: UpdateLabelData }>({
    mutationFn: ({ id, data }) =>
      labelService.updateLabel(clinicId, id, data),
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
