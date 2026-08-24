import { clinicaApiBase } from "@/lib/auth-server";

import type { PublicCampaignData } from "../campaign-public.model";

/**
 * Carrega campanha pública server-side (storeId na URL = clinic param).
 */
export async function getPublicCampaign(
  storeId: string,
  campaignSlug: string,
): Promise<PublicCampaignData> {
  const target = `${clinicaApiBase()}/v1/public/campaigns/${encodeURIComponent(storeId)}/${encodeURIComponent(campaignSlug)}`;
  const res = await fetch(target, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Campanha não encontrada (${res.status})`);
  }
  const payload = (await res.json()) as { data: PublicCampaignData };
  return payload.data;
}
