import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { CommissionConfigEntity } from '../../domain/entities/commission-config.entity';
import {
  CommissionConfigRepository,
  type CommissionConfigUpsertPayload,
} from '../../domain/repositories/commission-config.repository.interface';

type CommissionConfigRow = Prisma.CommissionConfigGetPayload<{
  include: { overrides: true };
}>;

const INCLUDE_OVERRIDES = {
  overrides: { orderBy: { agentId: Prisma.SortOrder.asc } },
} as const;

@Injectable()
export class PrismaCommissionConfigRepository extends CommissionConfigRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async getByStoreId(storeId: string): Promise<CommissionConfigEntity | null> {
    const row = await this.prisma.commissionConfig.findUnique({
      where: { storeId },
      include: INCLUDE_OVERRIDES,
    });
    return row ? this.toEntity(row) : null;
  }

  async upsert(
    storeId: string,
    payload: CommissionConfigUpsertPayload,
  ): Promise<CommissionConfigEntity> {
    const row = await this.prisma.$transaction(async (tx) => {
      const config = await tx.commissionConfig.upsert({
        where: { storeId },
        create: {
          id: randomUUID(),
          storeId,
          defaultCommissionPercent: payload.global.defaultCommissionPercent,
          agencyPercent: payload.global.defaultSplit.agencyPercent,
          captorPercent: payload.global.defaultSplit.captorPercent,
          sellerPercent: payload.global.defaultSplit.sellerPercent,
        },
        update: {
          defaultCommissionPercent: payload.global.defaultCommissionPercent,
          agencyPercent: payload.global.defaultSplit.agencyPercent,
          captorPercent: payload.global.defaultSplit.captorPercent,
          sellerPercent: payload.global.defaultSplit.sellerPercent,
        },
      });

      await tx.commissionAgentOverride.deleteMany({
        where: { configId: config.id },
      });
      if (payload.agentOverrides.length > 0) {
        await tx.commissionAgentOverride.createMany({
          data: payload.agentOverrides.map((override) => ({
            id: randomUUID(),
            storeId,
            configId: config.id,
            agentId: override.agentId,
            captorPercentOverride: override.captorPercentOverride,
            sellerPercentOverride: override.sellerPercentOverride,
          })),
        });
      }

      return tx.commissionConfig.findUniqueOrThrow({
        where: { id: config.id },
        include: INCLUDE_OVERRIDES,
      });
    });

    return this.toEntity(row);
  }

  private toEntity(row: CommissionConfigRow): CommissionConfigEntity {
    return CommissionConfigEntity.create(
      {
        storeId: row.storeId,
        defaultCommissionPercent: row.defaultCommissionPercent,
        defaultSplit: {
          agencyPercent: row.agencyPercent,
          captorPercent: row.captorPercent,
          sellerPercent: row.sellerPercent,
        },
        agentOverrides: row.overrides.map((override) => ({
          agentId: override.agentId,
          captorPercentOverride: override.captorPercentOverride,
          sellerPercentOverride: override.sellerPercentOverride,
        })),
      },
      row.id,
    );
  }
}
