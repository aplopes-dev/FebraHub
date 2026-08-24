import { useMutation, useQueryClient } from "@tanstack/react-query";
import { salesService } from "../services/sales.service";
import { useClinicId } from "../lib/use-clinic-id";
import { salesQueryKeys } from "./query-keys";

/** Garante que os funis padrão existem. */
export function useEnsureDefaultFunnels() {
  const queryClient = useQueryClient();
  const { clinicId } = useClinicId();

  return useMutation<
    {
      created: boolean;
      funnels: Array<{ id: string; name: string; isDefault: boolean }>;
    },
    Error
  >({
    mutationFn: () => salesService.ensureDefaultFunnels(clinicId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: salesQueryKeys.funnels(clinicId),
      });
    },
  });
}
