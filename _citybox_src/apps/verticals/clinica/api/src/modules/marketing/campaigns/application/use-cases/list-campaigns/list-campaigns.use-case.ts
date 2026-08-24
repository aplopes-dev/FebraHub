import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../../shared/core/use-case.interface';

import { birthdayCampaignCorrelationPrefix } from '../../../domain/content/aniversario.content';
import type {
  CampaignSegment,
  CampaignStatus,
} from '../../../domain/campaign.types';
import type { Campaign } from '../../../domain/entities/campaign.entity';
import { CampaignRepository } from '../../../domain/repositories/campaign.repository';
import { WhatsappMessageRepository } from '../../../../../whatsapp/domain/repositories/whatsapp-message.repository.interface';

export type ListCampaignsDto = {
  storeId: string;
  page?: number;
  perPage?: number;
  search?: string;
  status?: CampaignStatus;
  segment?: CampaignSegment;
};

export type ListCampaignsResult = {
  items: Campaign[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

@Injectable()
export class ListCampaignsUseCase implements IUseCase<
  ListCampaignsDto,
  ListCampaignsResult
> {
  constructor(
    private readonly campaigns: CampaignRepository,
    private readonly whatsappMessages: WhatsappMessageRepository,
  ) {}

  async execute(dto: ListCampaignsDto): Promise<ListCampaignsResult> {
    const page = dto.page ?? 1;
    const perPage = dto.perPage ?? 20;
    const skip = (page - 1) * perPage;
    const filters = {
      search: dto.search,
      status: dto.status,
      segment: dto.segment,
    };

    const [rawItems, total] = await Promise.all([
      this.campaigns.findMany(dto.storeId, { skip, take: perPage, ...filters }),
      this.campaigns.count(dto.storeId, filters),
    ]);

    const syncedItems = await Promise.all(
      rawItems.map(async (item) => {
        let campaign = item.syncDerivedStatus();
        if (campaign.status !== item.status) {
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
      }),
    );

    // Após sync, itens que mudaram de status saem do filtro da página (ex.: active → finished)
    const items =
      dto.status != null
        ? syncedItems.filter((item) => item.status === dto.status)
        : syncedItems;

    return {
      items,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage) || 0,
    };
  }
}
