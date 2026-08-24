import { useQuery } from '@tanstack/react-query';
import { publicCampaignsService } from '../services/public-campaigns.service';

export function usePublicCampaign(clinicSlug: string, campaignSlug: string) {
  return useQuery({
    queryKey: ['public', 'campaigns', clinicSlug, campaignSlug],
    queryFn: () => publicCampaignsService.getPublicCampaign(clinicSlug, campaignSlug),
    enabled: !!clinicSlug && !!campaignSlug,
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 1,
  });
}
