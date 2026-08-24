import type { SalesOpportunity } from '../entities/sales-opportunity.entity';
import type { SalesOpportunityHistory } from '../entities/sales-opportunity-history.entity';
import type { SalesOpportunityOrigin } from '../sales-opportunity.types';

export type SalesOpportunityPeriod =
  | 'all'
  | 'this_week'
  | 'this_month'
  | 'custom';

export type SalesOpportunityCampaignLink = {
  campaignId: string;
  campaignName: string;
};

export type SalesOpportunityListCriteria = {
  skip: number;
  take: number;
  funnelId?: string;
  /** Quando a listagem não tem funil único (filtro de visibilidade). */
  funnelIds?: string[];
  stageId?: string;
  patientId?: string;
  labelId?: string;
  origin?: SalesOpportunityOrigin;
  nextContactDate?: Date;
  period?: SalesOpportunityPeriod;
  startDate?: Date;
  endDate?: Date;
  search?: string;
};

export abstract class SalesOpportunityRepository {
  abstract findById(
    storeId: string,
    id: string,
  ): Promise<SalesOpportunity | null>;
  abstract findBySubmissionId(
    storeId: string,
    submissionId: string,
  ): Promise<SalesOpportunity | null>;
  abstract findByBudgetId(
    storeId: string,
    budgetId: string,
  ): Promise<SalesOpportunity | null>;
  abstract findMany(
    storeId: string,
    criteria: SalesOpportunityListCriteria,
  ): Promise<SalesOpportunity[]>;
  abstract count(
    storeId: string,
    criteria: Omit<SalesOpportunityListCriteria, 'skip' | 'take'>,
  ): Promise<number>;
  abstract nextSortOrder(storeId: string, stageId: string): Promise<number>;
  abstract create(
    opportunity: SalesOpportunity,
    history: SalesOpportunityHistory,
  ): Promise<SalesOpportunity>;
  abstract save(
    opportunity: SalesOpportunity,
    historyEntries?: SalesOpportunityHistory[],
  ): Promise<SalesOpportunity>;
  abstract reorder(
    storeId: string,
    items: Array<{ id: string; stageId: string; sortOrder: number }>,
  ): Promise<void>;
  abstract delete(storeId: string, id: string): Promise<void>;
  abstract listHistory(
    storeId: string,
    opportunityId: string,
  ): Promise<SalesOpportunityHistory[]>;
  abstract addHistory(
    entry: SalesOpportunityHistory,
  ): Promise<SalesOpportunityHistory>;
  abstract findCampaignLinksBySubmissionIds(
    storeId: string,
    submissionIds: string[],
  ): Promise<Record<string, SalesOpportunityCampaignLink>>;
}
