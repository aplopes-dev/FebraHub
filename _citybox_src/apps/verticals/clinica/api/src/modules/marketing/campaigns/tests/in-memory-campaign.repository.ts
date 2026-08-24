/* eslint-disable @typescript-eslint/require-await */
import type { Campaign } from '../domain/entities/campaign.entity';
import type { CampaignType } from '../domain/campaign.types';
import {
  CampaignRepository,
  type CampaignListCriteria,
} from '../domain/repositories/campaign.repository';

export class InMemoryCampaignRepository extends CampaignRepository {
  private readonly items = new Map<string, Campaign>();

  async findById(storeId: string, id: string): Promise<Campaign | null> {
    const item = this.items.get(id);
    if (!item || item.storeId !== storeId) return null;
    return item;
  }

  async findBySlug(storeId: string, slug: string): Promise<Campaign | null> {
    for (const item of this.items.values()) {
      if (item.storeId === storeId && item.slug === slug) return item;
    }
    return null;
  }

  async findMany(
    storeId: string,
    criteria: CampaignListCriteria,
  ): Promise<Campaign[]> {
    let all = [...this.items.values()].filter(
      (item) => item.storeId === storeId,
    );
    if (criteria.status) {
      all = all.filter((item) => item.status === criteria.status);
    }
    if (criteria.segment) {
      all = all.filter((item) => item.segment === criteria.segment);
    }
    if (criteria.search?.trim()) {
      const needle = criteria.search.trim().toLowerCase();
      all = all.filter((item) => item.name.toLowerCase().includes(needle));
    }
    all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return all.slice(criteria.skip, criteria.skip + criteria.take);
  }

  async count(
    storeId: string,
    criteria: Omit<CampaignListCriteria, 'skip' | 'take'>,
  ): Promise<number> {
    const page = await this.findMany(storeId, {
      ...criteria,
      skip: 0,
      take: Number.MAX_SAFE_INTEGER,
    });
    return page.length;
  }

  async create(campaign: Campaign): Promise<Campaign> {
    this.items.set(campaign.id, campaign);
    return campaign;
  }

  async save(campaign: Campaign): Promise<Campaign> {
    this.items.set(campaign.id, campaign);
    return campaign;
  }

  async findActiveByType(
    type: CampaignType,
    storeId?: string,
  ): Promise<Campaign[]> {
    return [...this.items.values()].filter(
      (item) =>
        item.type === type &&
        item.status === 'active' &&
        (storeId === undefined || item.storeId === storeId),
    );
  }
}
