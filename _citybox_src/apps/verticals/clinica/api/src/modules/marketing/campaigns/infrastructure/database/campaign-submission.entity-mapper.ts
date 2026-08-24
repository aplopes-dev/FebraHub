import type {
  CampaignSubmission as PrismaSubmission,
  Prisma,
} from '../../../../../../generated/prisma/client';

import { CampaignSubmission } from '../../domain/entities/campaign-submission.entity';

export class CampaignSubmissionEntityMapper {
  static toDomain(row: PrismaSubmission): CampaignSubmission {
    return CampaignSubmission.with(
      {
        storeId: row.storeId,
        campaignId: row.campaignId,
        campaignType: row.campaignType,
        source: row.source,
        payload: (row.payload ?? {}) as Record<string, unknown>,
        metadata: (row.metadata ?? {}) as Record<string, unknown>,
        phoneKey: row.phoneKey,
        isDuplicate: row.isDuplicate,
        submittedAt: row.submittedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }

  static toPersistence(
    submission: CampaignSubmission,
  ): Prisma.CampaignSubmissionUncheckedCreateInput {
    return {
      id: submission.id,
      storeId: submission.storeId,
      campaignId: submission.campaignId,
      campaignType: submission.campaignType,
      source: submission.source,
      payload: submission.payload as Prisma.InputJsonValue,
      metadata: submission.metadata as Prisma.InputJsonValue,
      phoneKey: submission.phoneKey,
      isDuplicate: submission.isDuplicate,
      submittedAt: submission.submittedAt,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
    };
  }
}
