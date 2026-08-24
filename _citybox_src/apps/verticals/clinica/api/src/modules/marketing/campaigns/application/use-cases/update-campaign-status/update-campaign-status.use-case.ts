import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { ValidatorDomainError } from '../../../../../../shared/core/errors/validator-domain.error';

import type { CampaignStatus } from '../../../domain/campaign.types';
import type { Campaign } from '../../../domain/entities/campaign.entity';
import { CampaignNotFoundError } from '../../../domain/errors/campaign-not-found.error';
import { CampaignRepository } from '../../../domain/repositories/campaign.repository';

export type UpdateCampaignStatusDto = {
  storeId: string;
  id: string;
  newStatus: CampaignStatus;
  endDate?: string;
};

@Injectable()
export class UpdateCampaignStatusUseCase implements IUseCase<
  UpdateCampaignStatusDto,
  Campaign
> {
  constructor(private readonly campaigns: CampaignRepository) {}

  async execute(dto: UpdateCampaignStatusDto): Promise<Campaign> {
    const campaign = await this.campaigns.findById(dto.storeId, dto.id);
    if (!campaign) {
      throw new CampaignNotFoundError(
        UpdateCampaignStatusUseCase.name,
        dto.id,
      );
    }

    if (campaign.status === 'finished' && dto.newStatus !== 'finished') {
      throw new ValidatorDomainError({
        internalMessage: 'Cannot reopen finished campaign',
        externalMessage: 'Campanha finalizada não pode mudar de status',
        context: UpdateCampaignStatusUseCase.name,
      });
    }

    const endDate =
      dto.endDate !== undefined
        ? new Date(dto.endDate)
        : dto.newStatus === 'finished'
          ? new Date()
          : undefined;

    const updated = campaign.withStatus({
      status: dto.newStatus,
      endDate,
    });

    return this.campaigns.save(updated);
  }
}
