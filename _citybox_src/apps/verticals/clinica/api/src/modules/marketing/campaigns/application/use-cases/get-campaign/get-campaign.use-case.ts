import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../../shared/core/use-case.interface';

import { birthdayCampaignCorrelationPrefix } from '../../../domain/content/aniversario.content';
import type { Campaign } from '../../../domain/entities/campaign.entity';
import { CampaignNotFoundError } from '../../../domain/errors/campaign-not-found.error';
import { CampaignRepository } from '../../../domain/repositories/campaign.repository';
import { WhatsappMessageRepository } from '../../../../../whatsapp/domain/repositories/whatsapp-message.repository.interface';

export type GetCampaignDto = {
  storeId: string;
  id: string;
};

@Injectable()
export class GetCampaignUseCase implements IUseCase<GetCampaignDto, Campaign> {
  constructor(
    private readonly campaigns: CampaignRepository,
    private readonly whatsappMessages: WhatsappMessageRepository,
  ) {}

  async execute(dto: GetCampaignDto): Promise<Campaign> {
    const found = await this.campaigns.findById(dto.storeId, dto.id);
    if (!found) {
      throw new CampaignNotFoundError(GetCampaignUseCase.name, dto.id);
    }

    let campaign = found.syncDerivedStatus();
    if (campaign.status !== found.status) {
      campaign = await this.campaigns.save(campaign);
    }

    if (campaign.type === 'aniversario') {
      const sent = await this.whatsappMessages.countByCorrelationIdPrefix(
        dto.storeId,
        birthdayCampaignCorrelationPrefix(campaign.id),
      );
      if (sent !== campaign.views) {
        campaign = await this.campaigns.save(
          campaign.withCounters({ views: sent }),
        );
      }
    }

    return campaign;
  }
}
