import type { PublicCampaignData } from "../campaign-public.model";

const PUBLIC_CAMPAIGN_BFF = "/api/public/clinic/campaigns";

export class PublicCampaignError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "PublicCampaignError";
  }
}

type PublicCampaignEnvelope = { data: PublicCampaignData };

type SubmitResult = {
  id: string;
  campaignId: string;
  submittedAt: string;
  successAction: "message" | "redirect";
  successMessage?: string;
  redirectUrl?: string;
};

async function extractErrorMessage(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as {
      error?: { message?: string } | string;
      message?: string;
    };
    if (typeof data.error === "string") return data.error;
    if (data.error && typeof data.error === "object" && data.error.message) {
      return data.error.message;
    }
    if (data.message) return data.message;
  } catch {
    // ignore
  }
  return `Erro na campanha pública (${res.status})`;
}

export async function fetchPublicCampaign(
  storeId: string,
  slug: string,
): Promise<PublicCampaignData> {
  const res = await fetch(
    `${PUBLIC_CAMPAIGN_BFF}/${encodeURIComponent(storeId)}/${encodeURIComponent(slug)}`,
    { cache: "no-store" },
  );
  if (!res.ok) {
    throw new PublicCampaignError(res.status, await extractErrorMessage(res));
  }
  const payload = (await res.json()) as PublicCampaignEnvelope;
  return payload.data;
}

export async function submitPublicCampaign(
  storeId: string,
  slug: string,
  body: {
    payload: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  },
): Promise<SubmitResult> {
  const res = await fetch(
    `${PUBLIC_CAMPAIGN_BFF}/${encodeURIComponent(storeId)}/${encodeURIComponent(slug)}/submissions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    throw new PublicCampaignError(res.status, await extractErrorMessage(res));
  }
  const payload = (await res.json()) as { data: SubmitResult };
  return payload.data;
}

/**
 * Conta 1 view. Dedupe de 30min fica no cookie do client (não chama se já visitou).
 */
export async function trackPublicCampaignView(
  storeId: string,
  slug: string,
): Promise<void> {
  const res = await fetch(
    `${PUBLIC_CAMPAIGN_BFF}/${encodeURIComponent(storeId)}/${encodeURIComponent(slug)}/views`,
    { method: "POST", cache: "no-store" },
  );
  if (!res.ok && res.status !== 204) {
    throw new PublicCampaignError(res.status, await extractErrorMessage(res));
  }
}
