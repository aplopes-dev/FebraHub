import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../../../generated/prisma/client';

import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';

import type { Campaign } from '../../domain/entities/campaign.entity';
import type { CampaignType } from '../../domain/campaign.types';
import { CampaignNotFoundError } from '../../domain/errors/campaign-not-found.error';
import { CampaignSlugTakenError } from '../../domain/errors/campaign-slug-taken.error';
import {
  CampaignRepository,
  type CampaignListCriteria,
} from '../../domain/repositories/campaign.repository';
import { CampaignEntityMapper } from './campaign.entity-mapper';

@Injectable()
export class PrismaCampaignRepository extends CampaignRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private buildWhere(
    storeId: string,
    criteria: Omit<CampaignListCriteria, 'skip' | 'take'>,
  ): Prisma.CampaignWhereInput {
    const where: Prisma.CampaignWhereInput = { storeId };
    if (criteria.status) {
      where.status = criteria.status;
    }
    if (criteria.segment) {
      where.segment = criteria.segment;
    }
    if (criteria.search?.trim()) {
      where.name = {
        contains: criteria.search.trim(),
        mode: 'insensitive',
      };
    }
    return where;
  }

  async findById(storeId: string, id: string): Promise<Campaign | null> {
    const row = await this.prisma.campaign.findFirst({
      where: { storeId, id },
    });
    return row ? CampaignEntityMapper.toDomain(row) : null;
  }

  async findBySlug(storeId: string, slug: string): Promise<Campaign | null> {
    const row = await this.prisma.campaign.findFirst({
      where: { storeId, slug },
    });
    return row ? CampaignEntityMapper.toDomain(row) : null;
  }

  async findMany(
    storeId: string,
    criteria: CampaignListCriteria,
  ): Promise<Campaign[]> {
    const rows = await this.prisma.campaign.findMany({
      where: this.buildWhere(storeId, criteria),
      orderBy: { createdAt: 'desc' },
      skip: criteria.skip,
      take: criteria.take,
    });
    return rows.map((row) => CampaignEntityMapper.toDomain(row));
  }

  async count(
    storeId: string,
    criteria: Omit<CampaignListCriteria, 'skip' | 'take'>,
  ): Promise<number> {
    return this.prisma.campaign.count({
      where: this.buildWhere(storeId, criteria),
    });
  }

  async create(campaign: Campaign): Promise<Campaign> {
    try {
      const row = await this.prisma.campaign.create({
        data: CampaignEntityMapper.toPersistence(campaign),
      });
      return CampaignEntityMapper.toDomain(row);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new CampaignSlugTakenError(
          PrismaCampaignRepository.name,
          campaign.slug,
        );
      }
      throw err;
    }
  }

  async save(campaign: Campaign): Promise<Campaign> {
    const data = CampaignEntityMapper.toPersistence(campaign);
    const result = await this.prisma.campaign.updateMany({
      where: { id: campaign.id, storeId: campaign.storeId },
      data: {
        name: data.name,
        slug: data.slug,
        segment: data.segment,
        type: data.type,
        strategy: data.strategy,
        status: data.status,
        channel: data.channel,
        statusType: data.statusType,
        startDate: data.startDate,
        endDate: data.endDate,
        leadLimit: data.leadLimit,
        views: data.views,
        submissions: data.submissions,
        funnelId: data.funnelId,
        stageId: data.stageId,
        content: data.content,
        publicUrl: data.publicUrl,
        updatedAt: data.updatedAt,
      },
    });
    if (result.count === 0) {
      throw new CampaignNotFoundError(
        PrismaCampaignRepository.name,
        campaign.id,
      );
    }
    const row = await this.prisma.campaign.findFirstOrThrow({
      where: { id: campaign.id, storeId: campaign.storeId },
    });
    return CampaignEntityMapper.toDomain(row);
  }

  async findActiveByType(
    type: CampaignType,
    storeId?: string,
  ): Promise<Campaign[]> {
    const rows = await this.prisma.campaign.findMany({
      where: {
        type,
        status: 'active',
        ...(storeId ? { storeId } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => CampaignEntityMapper.toDomain(row));
  }
}
