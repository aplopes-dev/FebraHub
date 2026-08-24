import { useQuery } from '@tanstack/react-query';
import { useClinicId } from '@/features/clinic/vendas/lib/use-clinic-id';
import type { CampaignWhatsappMessage } from '../services/campaigns.service';
import { campaignsService } from '../services/campaigns.service';
import { campaignsQueryKeys, campaignsQueryOptions } from './query-keys';

export function useCampaignWhatsappMessages(
  campaignId: string,
  options?: { withRepliesOnly?: boolean; search?: string },
) {
  const { clinicId, isReady } = useClinicId();
  const withRepliesOnly = options?.withRepliesOnly === true;
  const search = options?.search?.trim() || undefined;

  return useQuery<{
    items: CampaignWhatsappMessage[];
    meta: {
      total: number;
      page: number;
      perPage: number;
      totalPages: number;
    };
  }>({
    queryKey: campaignsQueryKeys.messages(clinicId, campaignId, {
      withRepliesOnly,
      search,
    }),
    queryFn: () =>
      campaignsService.listWhatsappMessages(clinicId, campaignId, {
        page: 1,
        perPage: 50,
        withRepliesOnly,
        search,
      }),
    enabled: isReady && Boolean(campaignId),
    ...campaignsQueryOptions,
  });
}
