/* eslint-disable @typescript-eslint/require-await */
import { SalesLabel } from '../domain/entities/sales-label.entity';
import {
  SalesLabelRepository,
  type SalesLabelListCriteria,
} from '../domain/repositories/sales-label.repository';

export class InMemorySalesLabelRepository extends SalesLabelRepository {
  private readonly items = new Map<string, SalesLabel>();
  /** Opportunity labelIds nullified on delete — for cross-module tests */
  public nullifiedOpportunityLabelIds: string[] = [];

  async findById(storeId: string, id: string): Promise<SalesLabel | null> {
    const item = this.items.get(id);
    if (!item || item.storeId !== storeId) return null;
    return item;
  }

  async findByName(storeId: string, name: string): Promise<SalesLabel | null> {
    const needle = name.trim().toLowerCase();
    for (const item of this.items.values()) {
      if (item.storeId === storeId && item.name.toLowerCase() === needle) {
        return item;
      }
    }
    return null;
  }

  async findMany(
    storeId: string,
    criteria: SalesLabelListCriteria,
  ): Promise<SalesLabel[]> {
    const all = [...this.items.values()]
      .filter((item) => item.storeId === storeId)
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    return all.slice(criteria.skip, criteria.skip + criteria.take);
  }

  async count(storeId: string): Promise<number> {
    return [...this.items.values()].filter((item) => item.storeId === storeId)
      .length;
  }

  async create(label: SalesLabel): Promise<SalesLabel> {
    this.items.set(label.id, label);
    return label;
  }

  async save(label: SalesLabel): Promise<SalesLabel> {
    this.items.set(label.id, label);
    return label;
  }

  async delete(storeId: string, id: string): Promise<void> {
    const item = this.items.get(id);
    if (item && item.storeId === storeId) {
      this.nullifiedOpportunityLabelIds.push(id);
      this.items.delete(id);
    }
  }
}
