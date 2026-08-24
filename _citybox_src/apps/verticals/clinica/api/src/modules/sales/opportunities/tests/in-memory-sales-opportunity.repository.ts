/* eslint-disable @typescript-eslint/require-await */
import { SalesOpportunity } from '../domain/entities/sales-opportunity.entity';
import { SalesOpportunityHistory } from '../domain/entities/sales-opportunity-history.entity';
import {
  SalesOpportunityRepository,
  type SalesOpportunityListCriteria,
} from '../domain/repositories/sales-opportunity.repository';
import { onlyDigits } from '../domain/sales-opportunity.types';
import {
  matchesNextContactDate,
  matchesOpportunityPeriod,
} from '../infrastructure/database/sales-opportunity-list.where';

export class InMemorySalesOpportunityRepository extends SalesOpportunityRepository {
  private readonly items = new Map<string, SalesOpportunity>();
  private readonly history = new Map<string, SalesOpportunityHistory[]>();

  async findById(
    storeId: string,
    id: string,
  ): Promise<SalesOpportunity | null> {
    const item = this.items.get(id);
    if (!item || item.storeId !== storeId) return null;
    return item;
  }

  async findBySubmissionId(
    storeId: string,
    submissionId: string,
  ): Promise<SalesOpportunity | null> {
    const matches = [...this.items.values()]
      .filter(
        (item) =>
          item.storeId === storeId && item.submissionId === submissionId,
      )
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    return matches[0] ?? null;
  }

  async findByBudgetId(
    storeId: string,
    budgetId: string,
  ): Promise<SalesOpportunity | null> {
    return (
      [...this.items.values()].find(
        (item) => item.storeId === storeId && item.budgetId === budgetId,
      ) ?? null
    );
  }

  private filterAll(
    storeId: string,
    criteria: Omit<SalesOpportunityListCriteria, 'skip' | 'take'>,
  ): SalesOpportunity[] {
    const search = criteria.search?.trim().toLowerCase();
    const searchDigits = search ? search.replace(/\D/g, '') : '';

    return [...this.items.values()].filter((opp) => {
      if (opp.storeId !== storeId) return false;
      if (criteria.funnelId && opp.funnelId !== criteria.funnelId) return false;
      if (
        criteria.funnelIds?.length &&
        !criteria.funnelIds.includes(opp.funnelId)
      )
        return false;
      if (criteria.stageId && opp.stageId !== criteria.stageId) return false;
      if (criteria.patientId && opp.patientId !== criteria.patientId)
        return false;
      if (criteria.labelId && opp.labelId !== criteria.labelId) return false;
      if (criteria.origin && opp.origin !== criteria.origin) return false;
      if (!matchesNextContactDate(opp.nextContact, criteria.nextContactDate))
        return false;
      if (
        !matchesOpportunityPeriod(
          opp.lastInteractionAt,
          opp.createdAt,
          criteria,
        )
      )
        return false;
      if (search) {
        const haystack = [opp.title, opp.patient?.name ?? '', opp.phone ?? '']
          .join(' ')
          .toLowerCase();
        const matchesText = haystack.includes(search);
        const matchesPhone =
          searchDigits.length > 0 && (opp.phone ?? '').includes(searchDigits);
        if (!matchesText && !matchesPhone) return false;
      }
      return true;
    });
  }

  async findMany(
    storeId: string,
    criteria: SalesOpportunityListCriteria,
  ): Promise<SalesOpportunity[]> {
    const all = this.filterAll(storeId, criteria).sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
    return all.slice(criteria.skip, criteria.skip + criteria.take);
  }

  async count(
    storeId: string,
    criteria: Omit<SalesOpportunityListCriteria, 'skip' | 'take'>,
  ): Promise<number> {
    return this.filterAll(storeId, criteria).length;
  }

  async nextSortOrder(storeId: string, stageId: string): Promise<number> {
    const inStage = [...this.items.values()].filter(
      (opp) => opp.storeId === storeId && opp.stageId === stageId,
    );
    if (inStage.length === 0) return 0;
    return Math.max(...inStage.map((opp) => opp.sortOrder)) + 1;
  }

  async create(
    opportunity: SalesOpportunity,
    history: SalesOpportunityHistory,
  ): Promise<SalesOpportunity> {
    this.items.set(opportunity.id, opportunity);
    this.history.set(opportunity.id, [history]);
    return opportunity;
  }

  async save(
    opportunity: SalesOpportunity,
    historyEntries: SalesOpportunityHistory[] = [],
  ): Promise<SalesOpportunity> {
    this.items.set(opportunity.id, opportunity);
    if (historyEntries.length > 0) {
      const list = this.history.get(opportunity.id) ?? [];
      this.history.set(opportunity.id, [...list, ...historyEntries]);
    }
    return opportunity;
  }

  async reorder(
    storeId: string,
    items: Array<{ id: string; stageId: string; sortOrder: number }>,
  ): Promise<void> {
    for (const item of items) {
      const current = this.items.get(item.id);
      if (!current || current.storeId !== storeId) continue;
      this.items.set(
        item.id,
        current.withUpdate({
          stageId: item.stageId,
          sortOrder: item.sortOrder,
        }),
      );
    }
  }

  async delete(storeId: string, id: string): Promise<void> {
    const item = this.items.get(id);
    if (item && item.storeId === storeId) {
      this.items.delete(id);
      this.history.delete(id);
    }
  }

  async listHistory(
    storeId: string,
    opportunityId: string,
  ): Promise<SalesOpportunityHistory[]> {
    const opp = this.items.get(opportunityId);
    if (!opp || opp.storeId !== storeId) return [];
    return [...(this.history.get(opportunityId) ?? [])].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
  }

  async addHistory(
    entry: SalesOpportunityHistory,
  ): Promise<SalesOpportunityHistory> {
    const list = this.history.get(entry.opportunityId) ?? [];
    this.history.set(entry.opportunityId, [...list, entry]);
    return entry;
  }

  async findCampaignLinksBySubmissionIds(
    _storeId: string,
    _submissionIds: string[],
  ): Promise<Record<string, { campaignId: string; campaignName: string }>> {
    return {};
  }

  /** helper for tests that assert phone digit normalization */
  static normalizePhone = onlyDigits;
}
