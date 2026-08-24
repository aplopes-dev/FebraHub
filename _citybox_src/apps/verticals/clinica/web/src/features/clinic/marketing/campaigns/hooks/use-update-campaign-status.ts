import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useClinicId } from "@/features/clinic/vendas/lib/use-clinic-id";

import type { Campaign, UpdateCampaignStatusData } from "../campaign.model";
import { campaignsService } from "../services/campaigns.service";
import { campaignsQueryKeys } from "./query-keys";

/**
 * Atualiza o status de uma campanha (ex.: finalizar).
 */
export function useUpdateCampaignStatus() {
  const queryClient = useQueryClient();
  const { clinicId } = useClinicId();

  return useMutation<
    Campaign,
    Error,
    { id: string; data: UpdateCampaignStatusData }
  >({
    mutationFn: ({ id, data }) =>
      campaignsService.updateStatus(clinicId, id, data),
    onSuccess: (campaign) => {
      void queryClient.invalidateQueries({
        queryKey: campaignsQueryKeys.all(clinicId),
        refetchType: "active",
      });
      queryClient.setQueryData(
        campaignsQueryKeys.detail(clinicId, campaign.id),
        campaign,
      );
      toast.success("Status da campanha atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar status da campanha");
    },
  });
}
