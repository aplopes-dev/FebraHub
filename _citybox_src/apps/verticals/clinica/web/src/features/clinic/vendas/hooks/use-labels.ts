import { useQuery } from "@tanstack/react-query";
import { labelService } from "../services/sales.service";
import { useClinicId } from "../lib/use-clinic-id";
import { salesQueryKeys } from "./query-keys";

/** Lista rótulos da clínica. */
export function useLabels() {
  const { clinicId, isReady } = useClinicId();

  return useQuery({
    queryKey: salesQueryKeys.labels(clinicId),
    queryFn: () => labelService.listLabels(clinicId),
    enabled: isReady,
    staleTime: 5 * 60 * 1000,
  });
}
