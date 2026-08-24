/* eslint-disable @typescript-eslint/require-await */
import { SalesFunnel } from '../domain/entities/sales-funnel.entity';
import {
  SalesFunnelRepository,
  type SalesFunnelListCriteria,
} from '../domain/repositories/sales-funnel.repository';

export class InMemorySalesFunnelRepository extends SalesFunnelRepository {
  private readonly items = new Map<string, SalesFunnel>();
  private readonly opportunityCountsByStage = new Map<string, number>();

  seedOpportunityCount(stageId: string, count: number): void {
    this.opportunityCountsByStage.set(stageId, count);
  }

  async findById(storeId: string, id: string): Promise<SalesFunnel | null> {
    const item = this.items.get(id);
    if (!item || item.storeId !== storeId) return null;
    return item;
  }

  async findMany(
    storeId: string,
    criteria: SalesFunnelListCriteria,
  ): Promise<SalesFunnel[]> {
    const all = [...this.items.values()]
      .filter((item) => item.storeId === storeId)
      .sort((a, b) => {
        if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
    return all.slice(criteria.skip, criteria.skip + criteria.take);
  }

  async count(storeId: string): Promise<number> {
    return [...this.items.values()].filter((i) => i.storeId === storeId).length;
  }

  async countDefaults(storeId: string): Promise<number> {
    return [...this.items.values()].filter(
      (i) => i.storeId === storeId && i.isDefault,
    ).length;
  }

  async listDefaults(
    storeId: string,
  ): Promise<Array<{ id: string; name: string; isDefault: boolean }>> {
    return [...this.items.values()]
      .filter((i) => i.storeId === storeId && i.isDefault)
      .map((i) => ({ id: i.id, name: i.name, isDefault: i.isDefault }));
  }

  async create(funnel: SalesFunnel): Promise<SalesFunnel> {
    this.items.set(funnel.id, funnel);
    return funnel;
  }

  async createMany(funnels: SalesFunnel[]): Promise<SalesFunnel[]> {
    for (const funnel of funnels) this.items.set(funnel.id, funnel);
    return funnels;
  }

  async save(
    funnel: SalesFunnel,
    options?: { stageIdsToDelete?: string[] },
  ): Promise<SalesFunnel> {
    void options;
    this.items.set(funnel.id, funnel);
    return funnel;
  }

  async delete(storeId: string, id: string): Promise<void> {
    const item = this.items.get(id);
    if (item && item.storeId === storeId) this.items.delete(id);
  }

  async countOpportunitiesByStage(
    _storeId: string,
    stageId: string,
  ): Promise<number> {
    return this.opportunityCountsByStage.get(stageId) ?? 0;
  }
}
