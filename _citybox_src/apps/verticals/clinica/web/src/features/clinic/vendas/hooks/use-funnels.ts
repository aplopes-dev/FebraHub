import { useQuery } from "@tanstack/react-query";
import { salesService, type Funnel } from "../services/sales.service";
import { useClinicId } from "../lib/use-clinic-id";
import { salesQueryKeys } from "./query-keys";

/** Lista todos os funis da clínica. */
export function useFunnels() {
  const { clinicId, isReady } = useClinicId();

  return useQuery<Funnel[]>({
    queryKey: salesQueryKeys.funnels(clinicId),
    queryFn: async () => {
      const response = await salesService.listFunnels(clinicId);
      return response.funnels;
    },
    enabled: isReady,
    staleTime: 5 * 60 * 1000,
  });
}
