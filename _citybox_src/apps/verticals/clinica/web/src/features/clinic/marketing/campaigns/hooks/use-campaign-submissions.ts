import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

import { useClinicId } from "@/features/clinic/vendas/lib/use-clinic-id";

import type { CampaignSubmission } from "../submission.model";
import { campaignsService } from "../services/campaigns.service";
import { campaignsQueryKeys, campaignsQueryOptions } from "./query-keys";

/**
 * Lista respostas (submissões) de uma campanha.
 */
export function useCampaignSubmissions(
  campaignId: string,
  options?: {
    limit?: number;
    offset?: number;
  } & Omit<
    UseQueryOptions<CampaignSubmission[], Error>,
    "queryKey" | "queryFn" | "enabled"
  >,
) {
  const { clinicId, isReady } = useClinicId();
  const { limit = 50, offset = 0, ...queryOptions } = options || {};
  const page = limit > 0 ? Math.floor(offset / limit) + 1 : 1;

  return useQuery<CampaignSubmission[], Error>({
    queryKey: campaignsQueryKeys.submissions(clinicId, campaignId, {
      page,
      perPage: limit,
    }),
    queryFn: () =>
      campaignsService.listSubmissions(clinicId, campaignId, limit, offset),
    enabled: isReady && Boolean(campaignId),
    ...campaignsQueryOptions,
    ...queryOptions,
  });
}
