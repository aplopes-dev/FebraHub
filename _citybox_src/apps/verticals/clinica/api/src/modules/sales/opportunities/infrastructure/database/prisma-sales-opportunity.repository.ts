import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';

import type { SalesOpportunity } from '../../domain/entities/sales-opportunity.entity';
import type { SalesOpportunityHistory } from '../../domain/entities/sales-opportunity-history.entity';
import { SalesOpportunityNotFoundError } from '../../domain/errors/sales-opportunity-not-found.error';
import {
  SalesOpportunityRepository,
  type SalesOpportunityListCriteria,
} from '../../domain/repositories/sales-opportunity.repository';
import { buildOpportunityListWhere } from './sales-opportunity-list.where';
import { SalesOpportunityEntityMapper } from './sales-opportunity.entity-mapper';

const includePatientStage = {
  stage: { select: { type: true as const } },
  patient: { select: { name: true, phone: true, email: true } },
};

@Injectable()
export class PrismaSalesOpportunityRepository extends SalesOpportunityRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    storeId: string,
    id: string,
  ): Promise<SalesOpportunity | null> {
    const row = await this.prisma.salesOpportunity.findFirst({
      where: { storeId, id },
      include: includePatientStage,
    });
    return row ? SalesOpportunityEntityMapper.toDomain(row) : null;
  }

  async findBySubmissionId(
    storeId: string,
    submissionId: string,
  ): Promise<SalesOpportunity | null> {
    const row = await this.prisma.salesOpportunity.findFirst({
      where: { storeId, submissionId },
      include: includePatientStage,
      orderBy: { updatedAt: 'desc' },
    });
    return row ? SalesOpportunityEntityMapper.toDomain(row) : null;
  }

  async findByBudgetId(
    storeId: string,
    budgetId: string,
  ): Promise<SalesOpportunity | null> {
    const row = await this.prisma.salesOpportunity.findFirst({
      where: { storeId, budgetId },
      include: includePatientStage,
    });
    return row ? SalesOpportunityEntityMapper.toDomain(row) : null;
  }

  async findMany(
    storeId: string,
    criteria: SalesOpportunityListCriteria,
  ): Promise<SalesOpportunity[]> {
    const where = buildOpportunityListWhere(storeId, criteria);
    const rows = await this.prisma.salesOpportunity.findMany({
      where,
      include: includePatientStage,
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'asc' },
      ],
      skip: criteria.skip,
      take: criteria.take,
    });
    return rows.map((row) => SalesOpportunityEntityMapper.toDomain(row));
  }

  async count(
    storeId: string,
    criteria: Omit<SalesOpportunityListCriteria, 'skip' | 'take'>,
  ): Promise<number> {
    return this.prisma.salesOpportunity.count({
      where: buildOpportunityListWhere(storeId, criteria),
    });
  }

  async nextSortOrder(storeId: string, stageId: string): Promise<number> {
    const agg = await this.prisma.salesOpportunity.aggregate({
      where: { storeId, stageId },
      _max: { sortOrder: true },
    });
    return (agg._max.sortOrder ?? -1) + 1;
  }

  async create(
    opportunity: SalesOpportunity,
    history: SalesOpportunityHistory,
  ): Promise<SalesOpportunity> {
    const row = await this.prisma.$transaction(async (tx) => {
      await tx.salesOpportunity.create({
        data: {
          id: opportunity.id,
          storeId: opportunity.storeId,
          funnelId: opportunity.funnelId,
          stageId: opportunity.stageId,
          title: opportunity.title,
          description: opportunity.description,
          phone: opportunity.phone,
          origin: opportunity.origin,
          nextContact: opportunity.nextContact,
          patientId: opportunity.patientId,
          labelId: opportunity.labelId,
          submissionId: opportunity.submissionId,
          budgetId: opportunity.budgetId,
          sortOrder: opportunity.sortOrder,
          lastInteractionAt: opportunity.lastInteractionAt,
          createdAt: opportunity.createdAt,
          updatedAt: opportunity.updatedAt,
        },
      });
      await tx.salesOpportunityHistory.create({
        data: SalesOpportunityEntityMapper.toHistoryPersistence(history),
      });
      return tx.salesOpportunity.findFirstOrThrow({
        where: { id: opportunity.id },
        include: includePatientStage,
      });
    });
    return SalesOpportunityEntityMapper.toDomain(row);
  }

  async save(
    opportunity: SalesOpportunity,
    historyEntries: SalesOpportunityHistory[] = [],
  ): Promise<SalesOpportunity> {
    const row = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.salesOpportunity.updateMany({
        where: { id: opportunity.id, storeId: opportunity.storeId },
        data: {
          stageId: opportunity.stageId,
          title: opportunity.title,
          description: opportunity.description,
          phone: opportunity.phone,
          origin: opportunity.origin,
          nextContact: opportunity.nextContact,
          patientId: opportunity.patientId,
          labelId: opportunity.labelId,
          sortOrder: opportunity.sortOrder,
          lastInteractionAt: opportunity.lastInteractionAt,
          updatedAt: opportunity.updatedAt,
        },
      });
      if (updated.count === 0) {
        throw new SalesOpportunityNotFoundError(
          PrismaSalesOpportunityRepository.name,
          opportunity.id,
        );
      }
      for (const entry of historyEntries) {
        await tx.salesOpportunityHistory.create({
          data: SalesOpportunityEntityMapper.toHistoryPersistence(entry),
        });
      }
      return tx.salesOpportunity.findFirstOrThrow({
        where: { id: opportunity.id, storeId: opportunity.storeId },
        include: includePatientStage,
      });
    });
    return SalesOpportunityEntityMapper.toDomain(row);
  }

  async reorder(
    storeId: string,
    items: Array<{ id: string; stageId: string; sortOrder: number }>,
  ): Promise<void> {
    if (items.length === 0) return;
    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        const result = await tx.salesOpportunity.updateMany({
          where: { id: item.id, storeId },
          data: {
            stageId: item.stageId,
            sortOrder: item.sortOrder,
            updatedAt: new Date(),
          },
        });
        if (result.count === 0) {
          throw new SalesOpportunityNotFoundError(
            PrismaSalesOpportunityRepository.name,
            item.id,
          );
        }
      }
    });
  }

  async delete(storeId: string, id: string): Promise<void> {
    await this.prisma.salesOpportunity.deleteMany({ where: { storeId, id } });
  }

  async listHistory(
    storeId: string,
    opportunityId: string,
  ): Promise<SalesOpportunityHistory[]> {
    const rows = await this.prisma.salesOpportunityHistory.findMany({
      where: { storeId, opportunityId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => SalesOpportunityEntityMapper.toHistoryDomain(row));
  }

  async findCampaignLinksBySubmissionIds(
    storeId: string,
    submissionIds: string[],
  ): Promise<
    Record<string, { campaignId: string; campaignName: string }>
  > {
    if (submissionIds.length === 0) {
      return {};
    }

    const rows = await this.prisma.campaignSubmission.findMany({
      where: { storeId, id: { in: submissionIds } },
      select: {
        id: true,
        campaignId: true,
        campaign: { select: { name: true } },
      },
    });

    return Object.fromEntries(
      rows.map((row) => [
        row.id,
        { campaignId: row.campaignId, campaignName: row.campaign.name },
      ]),
    );
  }

  async addHistory(
    entry: SalesOpportunityHistory,
  ): Promise<SalesOpportunityHistory> {
    const row = await this.prisma.salesOpportunityHistory.create({
      data: SalesOpportunityEntityMapper.toHistoryPersistence(entry),
    });
    return SalesOpportunityEntityMapper.toHistoryDomain(row);
  }
}
