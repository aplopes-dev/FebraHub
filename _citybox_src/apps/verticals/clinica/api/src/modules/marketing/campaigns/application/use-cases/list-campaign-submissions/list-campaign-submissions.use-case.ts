import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../../shared/core/use-case.interface';

import type { CampaignSubmission } from '../../../domain/entities/campaign-submission.entity';
import { CampaignNotFoundError } from '../../../domain/errors/campaign-not-found.error';
import { CampaignRepository } from '../../../domain/repositories/campaign.repository';
import { CampaignSubmissionRepository } from '../../../domain/repositories/campaign-submission.repository';

export type ListCampaignSubmissionsDto = {
  storeId: string;
  campaignId: string;
  page?: number;
  perPage?: number;
};

export type ListCampaignSubmissionsResult = {
  items: CampaignSubmission[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

@Injectable()
export class ListCampaignSubmissionsUseCase implements IUseCase<
  ListCampaignSubmissionsDto,
  ListCampaignSubmissionsResult
> {
  constructor(
    private readonly campaigns: CampaignRepository,
    private readonly submissions: CampaignSubmissionRepository,
  ) {}

  async execute(
    dto: ListCampaignSubmissionsDto,
  ): Promise<ListCampaignSubmissionsResult> {
    const campaign = await this.campaigns.findById(
      dto.storeId,
      dto.campaignId,
    );
    if (!campaign) {
      throw new CampaignNotFoundError(
        ListCampaignSubmissionsUseCase.name,
        dto.campaignId,
      );
    }

    const page = dto.page ?? 1;
    const perPage = dto.perPage ?? 50;
    const skip = (page - 1) * perPage;

    const [items, total] = await Promise.all([
      this.submissions.findManyByCampaign(dto.storeId, dto.campaignId, {
        skip,
        take: perPage,
      }),
      this.submissions.countByCampaign(dto.storeId, dto.campaignId),
    ]);

    return {
      items,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage) || 0,
    };
  }
}
