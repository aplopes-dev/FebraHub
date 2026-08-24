/**
 * Service de campanhas — backoffice via clinica-api.
 * QR Code é gerado no client (`qrcode.react`), sem endpoint.
 */
import type {
  Campaign,
  CreateCampaignData,
  UpdateCampaignStatusData,
} from "../campaign.model";
import type { CampaignSubmission } from "../submission.model";
import {
  campaignsApiService,
  type CampaignWhatsappMessage,
  type ListCampaignsParams,
  type ListCampaignsResult,
} from "./campaigns.api.service";

export const campaignsService = {
  list: (
    storeId: string,
    params?: ListCampaignsParams,
  ): Promise<ListCampaignsResult> => campaignsApiService.list(storeId, params),

  get: (storeId: string, id: string): Promise<Campaign> =>
    campaignsApiService.get(storeId, id),

  create: (storeId: string, data: CreateCampaignData): Promise<Campaign> =>
    campaignsApiService.create(storeId, data),

  updateStatus: (
    storeId: string,
    id: string,
    data: UpdateCampaignStatusData,
  ): Promise<Campaign> => campaignsApiService.updateStatus(storeId, id, data),

  listSubmissions: (
    storeId: string,
    campaignId: string,
    limit?: number,
    offset?: number,
  ): Promise<CampaignSubmission[]> => {
    const page =
      limit && offset !== undefined
        ? Math.floor(offset / limit) + 1
        : 1;
    return campaignsApiService.listSubmissions(storeId, campaignId, {
      page,
      perPage: limit ?? 50,
    });
  },

  listWhatsappMessages: (
    storeId: string,
    campaignId: string,
    params?: {
      page?: number;
      perPage?: number;
      withRepliesOnly?: boolean;
      search?: string;
    },
  ) => campaignsApiService.listWhatsappMessages(storeId, campaignId, params),

  getSubmission: (
    storeId: string,
    submissionId: string,
  ): Promise<{ submission: CampaignSubmission; campaign: Campaign }> =>
    campaignsApiService.getSubmission(storeId, submissionId),
};

export type { CampaignWhatsappMessage, ListCampaignsParams, ListCampaignsResult };
