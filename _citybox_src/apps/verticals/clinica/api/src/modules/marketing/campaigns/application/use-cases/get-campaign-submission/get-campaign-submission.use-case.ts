import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../../shared/core/use-case.interface';

import type { Campaign } from '../../../domain/entities/campaign.entity';
import type { CampaignSubmission } from '../../../domain/entities/campaign-submission.entity';
import { CampaignNotFoundError } from '../../../domain/errors/campaign-not-found.error';
import { CampaignSubmissionNotFoundError } from '../../../domain/errors/campaign-submission-not-found.error';
import { CampaignRepository } from '../../../domain/repositories/campaign.repository';
import { CampaignSubmissionRepository } from '../../../domain/repositories/campaign-submission.repository';

export type GetCampaignSubmissionDto = {
  storeId: string;
  submissionId: string;
};

export type GetCampaignSubmissionResult = {
  submission: CampaignSubmission;
  campaign: Campaign;
};

@Injectable()
export class GetCampaignSubmissionUseCase implements IUseCase<
  GetCampaignSubmissionDto,
  GetCampaignSubmissionResult
> {
  constructor(
    private readonly submissions: CampaignSubmissionRepository,
    private readonly campaigns: CampaignRepository,
  ) {}

  async execute(
    dto: GetCampaignSubmissionDto,
  ): Promise<GetCampaignSubmissionResult> {
    const submission = await this.submissions.findByIdForStore(
      dto.storeId,
      dto.submissionId,
    );
    if (!submission) {
      throw new CampaignSubmissionNotFoundError(
        GetCampaignSubmissionUseCase.name,
        dto.submissionId,
      );
    }

    const campaign = await this.campaigns.findById(
      dto.storeId,
      submission.campaignId,
    );
    if (!campaign) {
      throw new CampaignNotFoundError(
        GetCampaignSubmissionUseCase.name,
        submission.campaignId,
      );
    }

    return { submission, campaign };
  }
}
