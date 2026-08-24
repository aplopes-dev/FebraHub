import {
  fetchPublicCampaign,
  submitPublicCampaign,
  trackPublicCampaignView,
} from "./public-campaigns.api";

/**
 * Facade do form público — BFF `/api/public/clinic/campaigns`.
 */
export const publicCampaignsService = {
  getPublicCampaign: fetchPublicCampaign,
  submit: submitPublicCampaign,
  trackView: trackPublicCampaignView,
};
