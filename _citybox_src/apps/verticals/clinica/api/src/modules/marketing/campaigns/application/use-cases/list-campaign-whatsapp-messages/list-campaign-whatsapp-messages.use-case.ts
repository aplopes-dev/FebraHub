import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../../shared/core/use-case.interface';

import { birthdayCampaignCorrelationPrefix } from '../../../domain/content/aniversario.content';
import { CampaignNotFoundError } from '../../../domain/errors/campaign-not-found.error';
import { CampaignRepository } from '../../../domain/repositories/campaign.repository';
import { WhatsappMessageRepository } from '../../../../../whatsapp/domain/repositories/whatsapp-message.repository.interface';
import type { WhatsappMessageStatus } from '../../../../../whatsapp/domain/whatsapp.types';

export type ListCampaignWhatsappMessagesDto = {
  storeId: string;
  campaignId: string;
  page?: number;
  perPage?: number;
  withRepliesOnly?: boolean;
  search?: string;
};

export type CampaignWhatsappMessageItem = {
  id: string;
  patientId: string;
  patientName: string;
  status: WhatsappMessageStatus;
  createdAt: string;
  updatedAt: string;
  replyBody: string | null;
  repliedAt: string | null;
};

export type ListCampaignWhatsappMessagesResult = {
  items: CampaignWhatsappMessageItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

@Injectable()
export class ListCampaignWhatsappMessagesUseCase
  implements
    IUseCase<ListCampaignWhatsappMessagesDto, ListCampaignWhatsappMessagesResult>
{
  constructor(
    private readonly campaigns: CampaignRepository,
    private readonly messages: WhatsappMessageRepository,
  ) {}

  async execute(
    dto: ListCampaignWhatsappMessagesDto,
  ): Promise<ListCampaignWhatsappMessagesResult> {
    const campaign = await this.campaigns.findById(dto.storeId, dto.campaignId);
    if (!campaign) {
      throw new CampaignNotFoundError(
        ListCampaignWhatsappMessagesUseCase.name,
        dto.campaignId,
      );
    }

    const page = Math.max(1, dto.page ?? 1);
    const perPage = Math.min(100, Math.max(1, dto.perPage ?? 50));
    const skip = (page - 1) * perPage;

    const prefix =
      campaign.type === 'aniversario'
        ? birthdayCampaignCorrelationPrefix(campaign.id)
        : `campaign:${campaign.id}:`;

    const { items, total } = await this.messages.listByCorrelationIdPrefix(
      dto.storeId,
      prefix,
      {
        skip,
        take: perPage,
        withRepliesOnly: dto.withRepliesOnly === true,
        search: dto.search,
      },
    );

    return {
      items: items.map(({ message, patientName, replyBody, repliedAt }) => ({
        id: message.id,
        patientId: message.patientId,
        patientName,
        status: message.status,
        createdAt: message.createdAt.toISOString(),
        updatedAt: message.updatedAt.toISOString(),
        replyBody,
        repliedAt: repliedAt?.toISOString() ?? null,
      })),
      total,
      page,
      perPage,
      totalPages: Math.max(1, Math.ceil(total / perPage) || 0),
    };
  }
}
