import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  labelService,
  type CreateLabelData,
  type Label,
} from "../services/sales.service";
import { useClinicId } from "../lib/use-clinic-id";
import { salesQueryKeys } from "./query-keys";

/** Cria um rótulo. */
export function useCreateLabel() {
  const queryClient = useQueryClient();
  const { clinicId } = useClinicId();

  return useMutation<Label, Error, CreateLabelData>({
    mutationFn: (data) => labelService.createLabel(clinicId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: salesQueryKeys.labels(clinicId),
      });
    },
  });
}
