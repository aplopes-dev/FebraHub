import { randomUUID } from 'crypto';
import {
  DashboardSalesGoalRepository,
  type DashboardSalesGoalRecord,
} from '../domain/repositories/dashboard-sales-goal.repository.interface';

export class InMemoryDashboardSalesGoalRepository extends DashboardSalesGoalRepository {
  private readonly rows: DashboardSalesGoalRecord[] = [];

  async findActive(storeId: string): Promise<DashboardSalesGoalRecord | null> {
    const byStore = this.rows.filter((row) => row.storeId === storeId);
    if (byStore.length === 0) return null;
    return byStore.reduce((latest, row) =>
      row.createdAt.getTime() >= latest.createdAt.getTime() ? row : latest,
    );
  }

  async create(input: {
    storeId: string;
    goalCents: number;
    startDate: string;
  }): Promise<DashboardSalesGoalRecord> {
    const created: DashboardSalesGoalRecord = {
      id: randomUUID(),
      storeId: input.storeId,
      goalCents: input.goalCents,
      startDate: input.startDate,
      createdAt: new Date(),
    };
    this.rows.push(created);
    return created;
  }
}
