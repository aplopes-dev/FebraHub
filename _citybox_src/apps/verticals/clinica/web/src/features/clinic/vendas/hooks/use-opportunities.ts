import { useQuery } from "@tanstack/react-query";
import {
  salesService,
  type ListOpportunitiesFilters,
} from "../services/sales.service";
import { useClinicId } from "../lib/use-clinic-id";
import { salesQueryKeys } from "./query-keys";

/** Lista oportunidades com filtros opcionais. */
export function useOpportunities(filters?: ListOpportunitiesFilters) {
  const { clinicId, isReady } = useClinicId();

  return useQuery({
    queryKey: salesQueryKeys.opportunitiesList(clinicId, filters),
    queryFn: () => salesService.listOpportunities(clinicId, filters),
    enabled: isReady && Boolean(filters?.funnelId),
  });
}
