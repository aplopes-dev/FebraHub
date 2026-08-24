"use client";

import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import type { PublicCampaignData } from "../../campaign-public.model";
import { CampaignForm } from "./campaign-form";
import { CampaignStatusMessage } from "./campaign-status-message";
import {
  hasCampaignViewCookie,
  setCampaignViewCookie,
} from "@/features/clinic/marketing/campaigns/_ui/campaign-view-cookie";
import { publicCampaignsService } from "../../services/public-campaigns.service";

interface CampaignFormWrapperProps {
  campaign: PublicCampaignData;
}

export function CampaignFormWrapper({ campaign }: CampaignFormWrapperProps) {
  const params = useParams();
  const storeId = (params?.clinic as string) || "";
  const slug = (params?.slug as string) || "";
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current) return;
    if (campaign.status !== "active" || !campaign.campaignId) return;
    if (!storeId || !slug) return;
    if (hasCampaignViewCookie(campaign.campaignId)) return;

    trackedRef.current = true;

    void publicCampaignsService
      .trackView(storeId, slug)
      .then(() => {
        setCampaignViewCookie(campaign.campaignId);
      })
      .catch((error) => {
        trackedRef.current = false;
        console.error("Erro ao registrar visualização da campanha:", error);
      });
  }, [campaign.campaignId, campaign.status, storeId, slug]);

  if (campaign.status !== "active") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <CampaignStatusMessage />
      </div>
    );
  }

  return (
    <div
      className="w-full py-8 px-4 md:py-12 md:px-6 lg:py-16 overflow-y-auto h-screen"
      style={
        {
          "--primary-color": campaign.primaryColor || "#3b82f6",
          background:
            "linear-gradient(to bottom, rgb(var(--background)) 0%, rgb(var(--muted)/0.3) 100%)",
        } as React.CSSProperties
      }
    >
      <CampaignForm campaign={campaign} />
    </div>
  );
}
