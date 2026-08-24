import { useQuery } from "@tanstack/react-query";
import { salesService } from "../services/sales.service";
import { useClinicId } from "../lib/use-clinic-id";
import { salesQueryKeys } from "./query-keys";

/** Busca uma oportunidade por id. */
export function useFindOpportunity(id: string | null | undefined) {
  const { clinicId, isReady } = useClinicId();

  return useQuery({
    queryKey: salesQueryKeys.opportunity(clinicId, id ?? ""),
    queryFn: () => salesService.getOpportunity(clinicId, id as string),
    enabled: isReady && Boolean(id),
  });
}
