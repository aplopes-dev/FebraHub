import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicCampaign } from "@/features/clinic/marketing/campaigns/requests/public-campaign.request";
import { CampaignFormWrapper } from "@/features/clinic/marketing/campaigns/components/public-form/campaign-form-wrapper";
import { CampaignFormSkeleton } from "@/features/clinic/marketing/campaigns/components/public-form/campaign-form-skeleton";

interface PageParams {
  params: Promise<{
    clinic: string;
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const resolvedParams = await params;
  const { clinic: clinicSlug, slug: campaignSlug } = resolvedParams;

  try {
    const campaign = await getPublicCampaign(clinicSlug, campaignSlug);
    return {
      title: `${campaign.clinicName} - ${campaign.campaignName}`,
    };
  } catch {
    return {
      title: "Campanha",
    };
  }
}

async function CampaignContent({
  clinicSlug,
  campaignSlug,
}: {
  clinicSlug: string;
  campaignSlug: string;
}) {
  let campaign;
  try {
    campaign = await getPublicCampaign(clinicSlug, campaignSlug);
  } catch (error) {
    console.error("Error loading campaign:", error);
    notFound();
  }

  return <CampaignFormWrapper campaign={campaign} />;
}

export default async function PublicCampaignPage({ params }: PageParams) {
  const resolvedParams = await params;
  const { clinic: clinicSlug, slug: campaignSlug } = resolvedParams;

  return (
    <Suspense fallback={<CampaignFormSkeleton />}>
      <CampaignContent clinicSlug={clinicSlug} campaignSlug={campaignSlug} />
    </Suspense>
  );
}
