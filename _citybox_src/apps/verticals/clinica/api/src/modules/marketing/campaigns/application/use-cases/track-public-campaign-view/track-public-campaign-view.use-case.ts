import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../../shared/core/use-case.interface';

import type { Campaign } from '../../../domain/entities/campaign.entity';
import { CampaignNotFoundError } from '../../../domain/errors/campaign-not-found.error';
import { CampaignRepository } from '../../../domain/repositories/campaign.repository';

export type TrackPublicCampaignViewDto = {
  storeId: string;
  slug: string;
};

@Injectable()
export class TrackPublicCampaignViewUseCase implements IUseCase<
  TrackPublicCampaignViewDto,
  Campaign
> {
  constructor(private readonly campaigns: CampaignRepository) {}

  async execute(dto: TrackPublicCampaignViewDto): Promise<Campaign> {
    let campaign = await this.campaigns.findBySlug(dto.storeId, dto.slug);
    if (!campaign || campaign.type !== 'form_lead') {
      throw new CampaignNotFoundError(
        TrackPublicCampaignViewUseCase.name,
        dto.slug,
      );
    }

    const synced = campaign.syncDerivedStatus();
    if (synced.status !== campaign.status) {
      campaign = await this.campaigns.save(synced);
    }

    if (campaign.status !== 'active') {
      throw new CampaignNotFoundError(
        TrackPublicCampaignViewUseCase.name,
        dto.slug,
      );
    }
    if (campaign.hasReachedLeadLimit()) {
      throw new CampaignNotFoundError(
        TrackPublicCampaignViewUseCase.name,
        dto.slug,
      );
    }

    const updated = campaign.withCounters({ views: campaign.views + 1 });
    return this.campaigns.save(updated);
  }
}
