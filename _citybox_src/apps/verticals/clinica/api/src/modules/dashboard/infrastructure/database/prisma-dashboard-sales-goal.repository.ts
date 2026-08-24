import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  parseIsoDateOnly,
  toIsoDateOnly,
} from '../../../financial/entries/application/utils/financial-entry.utils';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  DashboardSalesGoalRepository,
  type DashboardSalesGoalRecord,
} from '../../domain/repositories/dashboard-sales-goal.repository.interface';

@Injectable()
export class PrismaDashboardSalesGoalRepository extends DashboardSalesGoalRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findActive(storeId: string): Promise<DashboardSalesGoalRecord | null> {
    const row = await this.prisma.dashboardSalesGoal.findFirst({
      where: { storeId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
    if (!row) return null;
    return this.toRecord(row);
  }

  async create(input: {
    storeId: string;
    goalCents: number;
    startDate: string;
  }): Promise<DashboardSalesGoalRecord> {
    const row = await this.prisma.dashboardSalesGoal.create({
      data: {
        id: randomUUID(),
        storeId: input.storeId,
        goalCents: input.goalCents,
        startDate: parseIsoDateOnly(input.startDate),
      },
    });
    return this.toRecord(row);
  }

  private toRecord(row: {
    id: string;
    storeId: string;
    goalCents: number;
    startDate: Date;
    createdAt: Date;
  }): DashboardSalesGoalRecord {
    return {
      id: row.id,
      storeId: row.storeId,
      goalCents: row.goalCents,
      startDate: toIsoDateOnly(row.startDate),
      createdAt: row.createdAt,
    };
  }
}
