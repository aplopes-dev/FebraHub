"use client";

import { CampaignViewHeader } from "../../campaign-view/campaign-view-header";
import { CampaignStatistics } from "../../campaign-view/campaign-statistics";
import { CampaignDetails } from "../../campaign-view/campaign-details";
import { CampaignSubmissionsList } from "../../campaign-view/campaign-submissions-list";

import type { Campaign } from "../../../campaign.model";

type PageCampaignViewTemplateProps = {
  campaign: Campaign;
};

export function PageCampaignViewTemplate({ campaign }: PageCampaignViewTemplateProps) {
  return (
    <div className="flex flex-col space-y-6">
      {/* Header */}
      <CampaignViewHeader campaign={campaign} />

      {/* Estatísticas */}
      <CampaignStatistics campaign={campaign} />

      {/* Detalhes da Campanha */}
      <CampaignDetails campaign={campaign} />

      {/* Lista de Respostas */}
      <CampaignSubmissionsList campaign={campaign} />
    </div>
  );
}
