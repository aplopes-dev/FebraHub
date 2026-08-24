import { clinicaFetch } from "@/features/clinic/shared/api";

import type {
  Campaign,
  CampaignChannel,
  CampaignSegment,
  CampaignStatus,
  CampaignStatusType,
  CampaignStrategy,
  CampaignType,
  CreateCampaignData,
  UpdateCampaignStatusData,
} from "../campaign.model";
import type { CampaignSubmission } from "../submission.model";

type PaginatedMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type CampaignWhatsappMessageStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "failed"
  | "received";

export type CampaignWhatsappMessage = {
  id: string;
  patientId: string;
  patientName: string;
  status: CampaignWhatsappMessageStatus;
  createdAt: string;
  updatedAt: string;
  replyBody: string | null;
  repliedAt: string | null;
};

type CampaignApiResponse = {
  id: string;
  storeId: string;
  name: string;
  slug: string;
  segment: CampaignSegment;
  type: CampaignType;
  strategy: CampaignStrategy;
  status: CampaignStatus;
  channel: CampaignChannel;
  statusType: CampaignStatusType;
  startDate: string | null;
  endDate: string | null;
  leadLimit: number | null;
  views: number;
  submissions: number;
  funnelId: string | null;
  stageId: string | null;
  content: Record<string, unknown>;
  publicUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListCampaignsParams = {
  page?: number;
  perPage?: number;
  search?: string;
  status?: string;
  segment?: string;
};

export type ListCampaignsResult = {
  campaigns: Campaign[];
  meta: PaginatedMeta;
};

/**
 * API devolve content canônico por tipo; a UI do detalhe PAGE ainda lê
 * content.stepTwo / stepThree / stepFour — espelha o shape do wizard form_lead.
 * BROADCAST (ex.: aniversario) mantém o content plano.
 */
function toUiContent(
  row: CampaignApiResponse,
): Record<string, unknown> {
  const raw = row.content ?? {};
  if (
    "stepTwo" in raw ||
    "stepThree" in raw ||
    "stepFour" in raw
  ) {
    return { ...raw };
  }

  if (row.strategy === "BROADCAST" || row.type === "aniversario") {
    return { ...raw };
  }

  const c = raw as {
    formDescription?: string;
    ownerId?: string;
    notifyOnLead?: boolean;
    notificationChannels?: string[];
    tags?: string[];
    duplicityRule?: string;
    fbPixelId?: string;
    googleTagId?: string;
    successAction?: string;
    successMessage?: string;
    redirectUrl?: string;
    introText?: string;
    questions?: unknown;
    lgpdConsent?: unknown;
    primaryColor?: string;
    logoUrl?: string;
  };

  return {
    stepTwo: {
      formDescription: c.formDescription,
      ownerId: c.ownerId,
      notifyOnLead: c.notifyOnLead ?? false,
      notificationChannels: c.notificationChannels,
      tags: c.tags,
      duplicityRule: c.duplicityRule ?? "block",
      fbPixelId: c.fbPixelId,
      googleTagId: c.googleTagId,
      successAction: c.successAction ?? "message",
      successMessage: c.successMessage,
      redirectUrl: c.redirectUrl,
      funnelId: row.funnelId ?? undefined,
      stageId: row.stageId ?? undefined,
    },
    stepThree: {
      introText: c.introText,
      questions: c.questions,
      lgpdConsent: c.lgpdConsent,
      primaryColor: c.primaryColor,
      logoUrl: c.logoUrl,
    },
    stepFour: {
      statusType: row.statusType,
      endDate: row.endDate ?? undefined,
      leadLimit: row.leadLimit ?? undefined,
    },
  };
}

function mapCampaign(row: CampaignApiResponse): Campaign {
  return {
    id: row.id,
    clinicId: row.storeId,
    name: row.name,
    slug: row.slug,
    segment: row.segment,
    type: row.type,
    strategy: row.strategy,
    status: row.status,
    channel: row.channel,
    statusType: row.statusType,
    startDate: row.startDate ?? undefined,
    endDate: row.endDate ?? undefined,
    leadLimit: row.leadLimit ?? undefined,
    views: row.views,
    submissions: row.submissions,
    funnelId: row.funnelId ?? undefined,
    stageId: row.stageId ?? undefined,
    content: toUiContent(row),
    publicUrl: row.publicUrl ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function buildListQuery(params: ListCampaignsParams): string {
  const qs = new URLSearchParams();
  qs.set("page", String(params.page ?? 1));
  qs.set("perPage", String(params.perPage ?? 100));
  if (params.search?.trim()) qs.set("search", params.search.trim());
  if (params.status && params.status !== "all") {
    qs.set("status", params.status);
  }
  if (params.segment) qs.set("segment", params.segment);
  return qs.toString();
}

export const campaignsApiService = {
  list: async (
    storeId: string,
    params: ListCampaignsParams = {},
  ): Promise<ListCampaignsResult> => {
    const query = buildListQuery(params);
    const res = await clinicaFetch<{
      data: CampaignApiResponse[];
      meta: PaginatedMeta;
    }>(storeId, `/v1/campaigns?${query}`);

    return {
      campaigns: res.data.map(mapCampaign),
      meta: res.meta,
    };
  },

  get: async (storeId: string, id: string): Promise<Campaign> => {
    const res = await clinicaFetch<{ data: CampaignApiResponse }>(
      storeId,
      `/v1/campaigns/${id}`,
    );
    return mapCampaign(res.data);
  },

  create: async (
    storeId: string,
    data: CreateCampaignData,
  ): Promise<Campaign> => {
    const res = await clinicaFetch<{ data: CampaignApiResponse }>(
      storeId,
      "/v1/campaigns",
      {
        method: "POST",
        body: JSON.stringify({
          name: data.name,
          segment: data.segment,
          type: data.type,
          strategy: data.strategy,
          statusType: data.statusType,
          endDate: data.endDate,
          leadLimit: data.leadLimit,
          funnelId: data.funnelId,
          stageId: data.stageId,
          content: data.content,
        }),
      },
    );
    return mapCampaign(res.data);
  },

  updateStatus: async (
    storeId: string,
    id: string,
    data: UpdateCampaignStatusData,
  ): Promise<Campaign> => {
    const res = await clinicaFetch<{ data: CampaignApiResponse }>(
      storeId,
      `/v1/campaigns/${id}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({
          newStatus: data.newStatus,
          endDate: data.endDate,
        }),
      },
    );
    return mapCampaign(res.data);
  },

  listSubmissions: async (
    storeId: string,
    campaignId: string,
    params: { page?: number; perPage?: number } = {},
  ): Promise<CampaignSubmission[]> => {
    const qs = new URLSearchParams();
    qs.set("page", String(params.page ?? 1));
    qs.set("perPage", String(params.perPage ?? 50));
    const res = await clinicaFetch<{
      data: Array<{
        id: string;
        campaignId: string;
        campaignType: string;
        submittedAt: string;
        source: string;
        payload: Record<string, unknown>;
        metadata: Record<string, unknown>;
        isDuplicate?: boolean;
        createdAt: string;
        updatedAt: string;
      }>;
    }>(storeId, `/v1/campaigns/${campaignId}/submissions?${qs.toString()}`);

    return res.data.map((row) => ({
      id: row.id,
      campaignId: row.campaignId,
      campaignType: row.campaignType,
      submittedAt: row.submittedAt,
      source: row.source,
      payload: row.payload,
      metadata: row.metadata,
      isDuplicate: Boolean(row.isDuplicate),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  },

  listWhatsappMessages: async (
    storeId: string,
    campaignId: string,
    params: {
      page?: number;
      perPage?: number;
      withRepliesOnly?: boolean;
      search?: string;
    } = {},
  ): Promise<{
    items: CampaignWhatsappMessage[];
    meta: PaginatedMeta;
  }> => {
    const qs = new URLSearchParams();
    qs.set("page", String(params.page ?? 1));
    qs.set("perPage", String(params.perPage ?? 50));
    if (params.withRepliesOnly) qs.set("withReplies", "true");
    if (params.search?.trim()) qs.set("search", params.search.trim());
    const res = await clinicaFetch<{
      data: CampaignWhatsappMessage[];
      meta: PaginatedMeta;
    }>(storeId, `/v1/campaigns/${campaignId}/messages?${qs.toString()}`);
    return {
      items: res.data.map((row) => ({
        ...row,
        replyBody: row.replyBody ?? null,
        repliedAt: row.repliedAt ?? null,
      })),
      meta: res.meta,
    };
  },

  getSubmission: async (
    storeId: string,
    submissionId: string,
  ): Promise<{ submission: CampaignSubmission; campaign: Campaign }> => {
    const res = await clinicaFetch<{
      data: {
        submission: {
          id: string;
          campaignId: string;
          campaignType: string;
          submittedAt: string;
          source: string;
          payload: Record<string, unknown>;
          metadata: Record<string, unknown>;
          isDuplicate?: boolean;
          createdAt: string;
          updatedAt: string;
        };
        campaign: CampaignApiResponse;
      };
    }>(storeId, `/v1/campaigns/submissions/${submissionId}`);

    const row = res.data.submission;
    return {
      submission: {
        id: row.id,
        campaignId: row.campaignId,
        campaignType: row.campaignType,
        submittedAt: row.submittedAt,
        source: row.source,
        payload: row.payload,
        metadata: row.metadata,
        isDuplicate: Boolean(row.isDuplicate),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      campaign: mapCampaign(res.data.campaign),
    };
  },
};
