import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../../shared/core/use-case.interface';

import type { SalesOpportunity } from '../../../domain/entities/sales-opportunity.entity';
import {
  SalesOpportunityRepository,
  type SalesOpportunityListCriteria,
  type SalesOpportunityPeriod,
} from '../../../domain/repositories/sales-opportunity.repository';
import type { SalesOpportunityOrigin } from '../../../domain/sales-opportunity.types';

export type ListSalesOpportunitiesDto = {
  storeId: string;
  page?: number;
  perPage?: number;
  funnelId?: string;
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

export type ListSalesOpportunitiesResult = {
  items: SalesOpportunity[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

@Injectable()
export class ListSalesOpportunitiesUseCase implements IUseCase<
  ListSalesOpportunitiesDto,
  ListSalesOpportunitiesResult
> {
  constructor(private readonly repository: SalesOpportunityRepository) {}

  async execute(
    dto: ListSalesOpportunitiesDto,
  ): Promise<ListSalesOpportunitiesResult> {
    const page = dto.page ?? 1;
    const perPage = dto.perPage ?? 100;
    const skip = (page - 1) * perPage;

    const criteria: SalesOpportunityListCriteria = {
      skip,
      take: perPage,
      funnelId: dto.funnelId,
      funnelIds: dto.funnelIds,
      stageId: dto.stageId && dto.stageId !== 'all' ? dto.stageId : undefined,
      patientId: dto.patientId,
      labelId: dto.labelId && dto.labelId !== 'all' ? dto.labelId : undefined,
      origin: dto.origin,
      nextContactDate: dto.nextContactDate,
      period: dto.period ?? 'all',
      startDate: dto.startDate,
      endDate: dto.endDate,
      search: dto.search?.trim() || undefined,
    };

    const [items, total] = await Promise.all([
      this.repository.findMany(dto.storeId, criteria),
      this.repository.count(dto.storeId, criteria),
    ]);

    return {
      items,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage) || 0,
    };
  }
}
