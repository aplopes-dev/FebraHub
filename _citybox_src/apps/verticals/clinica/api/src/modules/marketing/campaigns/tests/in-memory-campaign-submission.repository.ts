/* eslint-disable @typescript-eslint/require-await */
import type { CampaignSubmission } from '../domain/entities/campaign-submission.entity';
import { CampaignSubmissionRepository } from '../domain/repositories/campaign-submission.repository';

export class InMemoryCampaignSubmissionRepository extends CampaignSubmissionRepository {
  private readonly items = new Map<string, CampaignSubmission>();

  async create(submission: CampaignSubmission): Promise<CampaignSubmission> {
    this.items.set(submission.id, submission);
    return submission;
  }

  async save(submission: CampaignSubmission): Promise<CampaignSubmission> {
    this.items.set(submission.id, submission);
    return submission;
  }

  async findById(
    storeId: string,
    campaignId: string,
    id: string,
  ): Promise<CampaignSubmission | null> {
    const item = this.items.get(id);
    if (!item || item.storeId !== storeId || item.campaignId !== campaignId) {
      return null;
    }
    return item;
  }

  async findLatestByPhone(
    storeId: string,
    campaignId: string,
    phoneKey: string,
  ): Promise<CampaignSubmission | null> {
    const matches = [...this.items.values()]
      .filter(
        (item) =>
          item.storeId === storeId &&
          item.campaignId === campaignId &&
          item.phoneKey === phoneKey,
      )
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
    return matches[0] ?? null;
  }

  async findByIdForStore(
    storeId: string,
    id: string,
  ): Promise<CampaignSubmission | null> {
    const item = this.items.get(id);
    if (!item || item.storeId !== storeId) {
      return null;
    }
    return item;
  }

  async findManyByCampaign(
    storeId: string,
    campaignId: string,
    criteria: { skip: number; take: number },
  ): Promise<CampaignSubmission[]> {
    const all = [...this.items.values()]
      .filter(
        (item) => item.storeId === storeId && item.campaignId === campaignId,
      )
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
    return all.slice(criteria.skip, criteria.skip + criteria.take);
  }

  async countByCampaign(storeId: string, campaignId: string): Promise<number> {
    return [...this.items.values()].filter(
      (item) => item.storeId === storeId && item.campaignId === campaignId,
    ).length;
  }
}
