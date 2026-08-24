import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useClinicId } from "@/features/clinic/vendas/lib/use-clinic-id";

import type { Campaign, CreateCampaignData } from "../campaign.model";
import { campaignsService } from "../services/campaigns.service";
import { campaignsQueryKeys } from "./query-keys";

/**
 * Cria uma nova campanha na clinica-api.
 */
export function useCreateCampaign() {
  const queryClient = useQueryClient();
  const { clinicId } = useClinicId();

  return useMutation<Campaign, Error, CreateCampaignData>({
    mutationFn: (data) => campaignsService.create(clinicId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: campaignsQueryKeys.all(clinicId),
        refetchType: "active",
      });
      toast.success("Campanha criada com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar campanha");
    },
  });
}
