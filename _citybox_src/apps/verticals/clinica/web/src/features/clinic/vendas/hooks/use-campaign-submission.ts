import { useQuery } from "@tanstack/react-query";

import { campaignsService } from "@/features/clinic/marketing/campaigns/services/campaigns.service";
import { useClinicId } from "@/features/clinic/vendas/lib/use-clinic-id";

export function useCampaignSubmission(
  submissionId: string | undefined,
  enabled: boolean,
) {
  const { clinicId, isReady } = useClinicId();

  return useQuery({
    queryKey: ["campaign-submission", clinicId, submissionId],
    queryFn: () => campaignsService.getSubmission(clinicId, submissionId!),
    enabled: isReady && enabled && Boolean(submissionId),
    staleTime: 60_000,
  });
}
