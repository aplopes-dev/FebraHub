import type { Campaign as PrismaCampaign, Prisma } from '../../../../../../generated/prisma/client';

import { Campaign } from '../../domain/entities/campaign.entity';
import type {
  CampaignChannel,
  CampaignSegment,
  CampaignStatus,
  CampaignStatusType,
  CampaignStrategy,
  CampaignType,
} from '../../domain/campaign.types';

export class CampaignEntityMapper {
  static toDomain(row: PrismaCampaign): Campaign {
    return Campaign.with(
      {
        storeId: row.storeId,
        name: row.name,
        slug: row.slug,
        segment: row.segment as CampaignSegment,
        type: row.type as CampaignType,
        strategy: row.strategy as CampaignStrategy,
        status: row.status as CampaignStatus,
        channel: row.channel as CampaignChannel,
        statusType: row.statusType as CampaignStatusType,
        startDate: row.startDate,
        endDate: row.endDate,
        leadLimit: row.leadLimit,
        views: row.views,
        submissions: row.submissions,
        funnelId: row.funnelId,
        stageId: row.stageId,
        content: (row.content ?? {}) as Record<string, unknown>,
        publicUrl: row.publicUrl,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }

  static toPersistence(campaign: Campaign): Prisma.CampaignUncheckedCreateInput {
    return {
      id: campaign.id,
      storeId: campaign.storeId,
      name: campaign.name,
      slug: campaign.slug,
      segment: campaign.segment,
      type: campaign.type,
      strategy: campaign.strategy,
      status: campaign.status,
      channel: campaign.channel,
      statusType: campaign.statusType,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      leadLimit: campaign.leadLimit,
      views: campaign.views,
      submissions: campaign.submissions,
      funnelId: campaign.funnelId,
      stageId: campaign.stageId,
      content: campaign.content as Prisma.InputJsonValue,
      publicUrl: campaign.publicUrl,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
    };
  }
}
