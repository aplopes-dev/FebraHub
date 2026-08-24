export interface CampaignSubmission {
  id: string;
  campaignId: string;
  campaignType: string;
  submittedAt: Date | string;
  source: string;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
  isDuplicate: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}
