"use client";

import { use } from "react";

import { PageContainer } from "@/features/clinic/marketing/campaigns/_ui/page-container";
import { useCampaign } from "@/features/clinic/marketing/campaigns/hooks/use-campaign";
import { BroadcastCampaignViewTemplate } from "@/features/clinic/marketing/campaigns/components/campaign-templates/broadcast-template/broadcast-campaign-view-template";
import { PageCampaignViewTemplate } from "@/features/clinic/marketing/campaigns/components/campaign-templates/page-template/page-campaign-view-template";
import { useClinicId } from "@/features/clinic/vendas/lib/use-clinic-id";

interface CampaignViewPageProps {
  params: Promise<{ id: string }>;
}

export default function CampaignViewPage({ params }: CampaignViewPageProps) {
  const { id: campaignId } = use(params);
  const { isReady } = useClinicId();
  const { data: campaign, isPending, error } = useCampaign(campaignId);

  if (!isReady || isPending) {
    return (
      <PageContainer>
        <div className="flex flex-1 flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">Carregando campanha...</p>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className="flex flex-1 flex-col items-center justify-center py-12">
          <p className="text-destructive">
            Erro ao carregar campanha: {error.message}
          </p>
        </div>
      </PageContainer>
    );
  }

  if (!campaign) {
    return (
      <PageContainer>
        <div className="flex flex-1 flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">Campanha não encontrada</p>
        </div>
      </PageContainer>
    );
  }

  if (campaign.strategy === "PAGE") {
    return (
      <PageContainer>
        <PageCampaignViewTemplate campaign={campaign} />
      </PageContainer>
    );
  }

  if (campaign.strategy === "BROADCAST") {
    return (
      <PageContainer>
        <BroadcastCampaignViewTemplate campaign={campaign} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">
          Template de visualização para estratégia {campaign.strategy} ainda
          não está implementado.
        </p>
      </div>
    </PageContainer>
  );
}
