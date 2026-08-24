import type { Campaign } from '../entities/campaign.entity';
import type {
  CampaignSegment,
  CampaignStatus,
  CampaignType,
} from '../campaign.types';

export type CampaignListCriteria = {
  skip: number;
  take: number;
  search?: string;
  status?: CampaignStatus;
  segment?: CampaignSegment;
};

export abstract class CampaignRepository {
  abstract findById(storeId: string, id: string): Promise<Campaign | null>;
  abstract findBySlug(storeId: string, slug: string): Promise<Campaign | null>;
  abstract findMany(
    storeId: string,
    criteria: CampaignListCriteria,
  ): Promise<Campaign[]>;
  abstract count(
    storeId: string,
    criteria: Omit<CampaignListCriteria, 'skip' | 'take'>,
  ): Promise<number>;
  abstract create(campaign: Campaign): Promise<Campaign>;
  abstract save(campaign: Campaign): Promise<Campaign>;
  /** Campanhas ativas de um tipo (todas as lojas, ou filtradas por storeId). */
  abstract findActiveByType(
    type: CampaignType,
    storeId?: string,
  ): Promise<Campaign[]>;
}
