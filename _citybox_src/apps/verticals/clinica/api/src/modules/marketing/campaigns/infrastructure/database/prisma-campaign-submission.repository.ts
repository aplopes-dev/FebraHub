import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';

import type { CampaignSubmission } from '../../domain/entities/campaign-submission.entity';
import { CampaignSubmissionRepository } from '../../domain/repositories/campaign-submission.repository';
import { CampaignSubmissionEntityMapper } from './campaign-submission.entity-mapper';

@Injectable()
export class PrismaCampaignSubmissionRepository extends CampaignSubmissionRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(submission: CampaignSubmission): Promise<CampaignSubmission> {
    const row = await this.prisma.campaignSubmission.create({
      data: CampaignSubmissionEntityMapper.toPersistence(submission),
    });
    return CampaignSubmissionEntityMapper.toDomain(row);
  }

  async save(submission: CampaignSubmission): Promise<CampaignSubmission> {
    const data = CampaignSubmissionEntityMapper.toPersistence(submission);
    await this.prisma.campaignSubmission.updateMany({
      where: {
        id: submission.id,
        storeId: submission.storeId,
        campaignId: submission.campaignId,
      },
      data: {
        payload: data.payload,
        metadata: data.metadata,
        phoneKey: data.phoneKey,
        isDuplicate: data.isDuplicate,
        updatedAt: data.updatedAt,
      },
    });
    const row = await this.prisma.campaignSubmission.findFirstOrThrow({
      where: { id: submission.id, storeId: submission.storeId },
    });
    return CampaignSubmissionEntityMapper.toDomain(row);
  }

  async findById(
    storeId: string,
    campaignId: string,
    id: string,
  ): Promise<CampaignSubmission | null> {
    const row = await this.prisma.campaignSubmission.findFirst({
      where: { storeId, campaignId, id },
    });
    return row ? CampaignSubmissionEntityMapper.toDomain(row) : null;
  }

  async findLatestByPhone(
    storeId: string,
    campaignId: string,
    phoneKey: string,
  ): Promise<CampaignSubmission | null> {
    const row = await this.prisma.campaignSubmission.findFirst({
      where: { storeId, campaignId, phoneKey },
      orderBy: { submittedAt: 'desc' },
    });
    return row ? CampaignSubmissionEntityMapper.toDomain(row) : null;
  }

  async findByIdForStore(
    storeId: string,
    id: string,
  ): Promise<CampaignSubmission | null> {
    const row = await this.prisma.campaignSubmission.findFirst({
      where: { storeId, id },
    });
    return row ? CampaignSubmissionEntityMapper.toDomain(row) : null;
  }

  async findManyByCampaign(
    storeId: string,
    campaignId: string,
    criteria: { skip: number; take: number },
  ): Promise<CampaignSubmission[]> {
    const rows = await this.prisma.campaignSubmission.findMany({
      where: { storeId, campaignId },
      orderBy: { submittedAt: 'desc' },
      skip: criteria.skip,
      take: criteria.take,
    });
    return rows.map((row) => CampaignSubmissionEntityMapper.toDomain(row));
  }

  async countByCampaign(storeId: string, campaignId: string): Promise<number> {
    return this.prisma.campaignSubmission.count({
      where: { storeId, campaignId },
    });
  }
}
