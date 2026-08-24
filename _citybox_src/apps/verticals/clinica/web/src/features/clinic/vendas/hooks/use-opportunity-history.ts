import { useQuery } from "@tanstack/react-query";
import { salesService } from "../services/sales.service";
import { useClinicId } from "../lib/use-clinic-id";
import { salesQueryKeys } from "./query-keys";

/** Histórico de uma oportunidade. */
export function useOpportunityHistory(opportunityId: string | null | undefined) {
  const { clinicId, isReady } = useClinicId();

  return useQuery({
    queryKey: salesQueryKeys.opportunityHistory(
      clinicId,
      opportunityId ?? "",
    ),
    queryFn: () =>
      salesService.getHistory(clinicId, opportunityId as string),
    enabled: isReady && Boolean(opportunityId),
  });
}
