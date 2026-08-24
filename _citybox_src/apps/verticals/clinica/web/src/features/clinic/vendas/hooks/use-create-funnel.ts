import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  salesService,
  type CreateFunnelData,
  type Funnel,
} from "../services/sales.service";
import { useClinicId } from "../lib/use-clinic-id";
import { salesQueryKeys } from "./query-keys";

/** Cria um novo funil. */
export function useCreateFunnel() {
  const queryClient = useQueryClient();
  const { clinicId } = useClinicId();

  return useMutation<Funnel, Error, CreateFunnelData>({
    mutationFn: (data) => salesService.createFunnel(clinicId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: salesQueryKeys.funnels(clinicId),
      });
    },
  });
}
