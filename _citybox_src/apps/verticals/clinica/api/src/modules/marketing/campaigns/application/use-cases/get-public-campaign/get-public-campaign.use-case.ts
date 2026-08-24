import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../../shared/core/use-case.interface';

import type { FormLeadContent } from '../../../domain/content/form-lead.content';
import type { Campaign } from '../../../domain/entities/campaign.entity';
import { CampaignNotFoundError } from '../../../domain/errors/campaign-not-found.error';
import { CampaignRepository } from '../../../domain/repositories/campaign.repository';

export type GetPublicCampaignDto = {
  storeId: string;
  slug: string;
};

export type PublicCampaignResult = {
  campaign: Campaign;
  content: FormLeadContent;
};

@Injectable()
export class GetPublicCampaignUseCase implements IUseCase<
  GetPublicCampaignDto,
  PublicCampaignResult
> {
  constructor(private readonly campaigns: CampaignRepository) {}

  async execute(dto: GetPublicCampaignDto): Promise<PublicCampaignResult> {
    let campaign = await this.campaigns.findBySlug(dto.storeId, dto.slug);
    if (!campaign || campaign.type !== 'form_lead') {
      throw new CampaignNotFoundError(
        GetPublicCampaignUseCase.name,
        dto.slug,
      );
    }

    // Repara limite atingido / período expirado (dados legados ou sem job de cron)
    const synced = campaign.syncDerivedStatus();
    if (synced.status !== campaign.status) {
      campaign = await this.campaigns.save(synced);
    }

    if (campaign.status !== 'active') {
      throw new CampaignNotFoundError(
        GetPublicCampaignUseCase.name,
        dto.slug,
      );
    }

    // GET público não incrementa views — o track é feito via POST /views (cookie 30min no client)
    return {
      campaign,
      content: campaign.content as FormLeadContent,
    };
  }
}
