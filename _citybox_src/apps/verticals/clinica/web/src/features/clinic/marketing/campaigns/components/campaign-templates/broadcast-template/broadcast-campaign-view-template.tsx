'use client';

import { CampaignViewHeader } from '../../campaign-view/campaign-view-header';
import { BroadcastCampaignStatistics } from '../../campaign-view/broadcast-campaign-statistics';
import { BroadcastCampaignDetails } from '../../campaign-view/broadcast-campaign-details';
import { BroadcastCampaignMessagesList } from '../../campaign-view/broadcast-campaign-messages-list';
import type { Campaign } from '../../../campaign.model';

type BroadcastCampaignViewTemplateProps = {
  campaign: Campaign;
};

export function BroadcastCampaignViewTemplate({
  campaign,
}: BroadcastCampaignViewTemplateProps) {
  return (
    <div className="flex flex-col space-y-6">
      <CampaignViewHeader campaign={campaign} />
      <BroadcastCampaignStatistics campaign={campaign} />
      <BroadcastCampaignDetails campaign={campaign} />
      <BroadcastCampaignMessagesList campaign={campaign} />
    </div>
  );
}
