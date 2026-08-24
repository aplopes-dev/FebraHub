import type { CampaignSubmission } from '../entities/campaign-submission.entity';

export abstract class CampaignSubmissionRepository {
  abstract create(
    submission: CampaignSubmission,
  ): Promise<CampaignSubmission>;
  abstract save(submission: CampaignSubmission): Promise<CampaignSubmission>;
  abstract findById(
    storeId: string,
    campaignId: string,
    id: string,
  ): Promise<CampaignSubmission | null>;
  abstract findLatestByPhone(
    storeId: string,
    campaignId: string,
    phoneKey: string,
  ): Promise<CampaignSubmission | null>;
  abstract findByIdForStore(
    storeId: string,
    id: string,
  ): Promise<CampaignSubmission | null>;
  abstract findManyByCampaign(
    storeId: string,
    campaignId: string,
    criteria: { skip: number; take: number },
  ): Promise<CampaignSubmission[]>;
  abstract countByCampaign(storeId: string, campaignId: string): Promise<number>;
}
