import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

import { useClinicId } from "@/features/clinic/vendas/lib/use-clinic-id";

import type { Campaign } from "../campaign.model";
import { campaignsService } from "../services/campaigns.service";
import { campaignsQueryKeys, campaignsQueryOptions } from "./query-keys";

/**
 * Busca uma campanha por ID (store-scoped).
 */
export function useCampaign(
  id: string,
  options?: Omit<
    UseQueryOptions<Campaign, Error>,
    "queryKey" | "queryFn" | "enabled"
  >,
) {
  const { clinicId, isReady } = useClinicId();

  return useQuery<Campaign, Error>({
    queryKey: campaignsQueryKeys.detail(clinicId, id),
    queryFn: () => campaignsService.get(clinicId, id),
    enabled: isReady && Boolean(id),
    ...campaignsQueryOptions,
    ...options,
  });
}
