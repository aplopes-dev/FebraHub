import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

import { useClinicId } from "@/features/clinic/vendas/lib/use-clinic-id";

import type { Campaign } from "../campaign.model";
import { campaignsService } from "../services/campaigns.service";
import { campaignsQueryKeys, campaignsQueryOptions } from "./query-keys";

/**
 * Lista campanhas da loja (filtro status/segment no backend).
 */
export function useCampaigns(
  status?: string,
  segment?: string,
  options?: Omit<
    UseQueryOptions<Campaign[], Error>,
    "queryKey" | "queryFn" | "enabled"
  >,
) {
  const { clinicId, isReady } = useClinicId();

  return useQuery<Campaign[], Error>({
    queryKey: campaignsQueryKeys.list(clinicId, { status, segment }),
    queryFn: async () => {
      const result = await campaignsService.list(clinicId, {
        status,
        segment,
        page: 1,
        perPage: 100,
      });
      return result.campaigns;
    },
    enabled: isReady,
    ...campaignsQueryOptions,
    ...options,
  });
}
