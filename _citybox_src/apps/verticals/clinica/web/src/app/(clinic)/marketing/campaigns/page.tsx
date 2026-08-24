"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

import { PageContainer } from "@/features/clinic/marketing/campaigns/_ui/page-container";
import { CampaignList } from "@/features/clinic/marketing/campaigns/components/campaign-list";
import { CampaignFilter } from "@/features/clinic/marketing/campaigns/components/campaign-filter";
import { ButtonNewCampaign } from "@/features/clinic/marketing/campaigns/components/button-new-campaign";
import { useCampaigns } from "@/features/clinic/marketing/campaigns/hooks/use-campaigns";
import { useUpdateCampaignStatus } from "@/features/clinic/marketing/campaigns/hooks/use-update-campaign-status";
import { mapApiCampaignToComponent } from "@/features/clinic/marketing/campaigns/utils/campaign-mapper";
import { useClinicId } from "@/features/clinic/vendas/lib/use-clinic-id";
import type { Campaign } from "@/features/clinic/marketing/campaigns/types";
import type { StatusFilter } from "@/features/clinic/marketing/campaigns/constants";

export default function CampaignsPage() {
  const router = useRouter();
  const { isReady } = useClinicId();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const statusForApi = statusFilter === "all" ? undefined : statusFilter;

  const { data: apiCampaigns, isPending, error } = useCampaigns(statusForApi);
  const updateStatusMutation = useUpdateCampaignStatus();

  const campaigns = useMemo(() => {
    if (!apiCampaigns) return [];
    return apiCampaigns.map(mapApiCampaignToComponent);
  }, [apiCampaigns]);

  const handleView = (campaign: Campaign) => {
    router.push(`/marketing/campaigns/${campaign.id}`);
  };

  const handleFinish = (campaign: Campaign) => {
    updateStatusMutation.mutate({
      id: campaign.id,
      data: { newStatus: "finished" },
    });
  };

  if (!isReady || isPending) {
    return (
      <PageContainer>
        <div className="flex flex-1 flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">Carregando campanhas...</p>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className="flex flex-1 flex-col items-center justify-center py-12">
          <p className="text-destructive">
            Erro ao carregar campanhas: {error.message}
          </p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CampaignFilter value={statusFilter} onValueChange={setStatusFilter} />
          <ButtonNewCampaign />
        </div>

        <CampaignList
          campaigns={campaigns}
          statusFilter={statusFilter}
          onView={handleView}
          onFinish={handleFinish}
        />
      </div>
    </PageContainer>
  );
}
