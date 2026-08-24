import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../../shared/core/use-case.interface';

import type { SalesOpportunityHistory } from '../../../domain/entities/sales-opportunity-history.entity';
import { SalesOpportunityNotFoundError } from '../../../domain/errors/sales-opportunity-not-found.error';
import { SalesOpportunityRepository } from '../../../domain/repositories/sales-opportunity.repository';

export type ListSalesOpportunityHistoryDto = {
  storeId: string;
  opportunityId: string;
};

@Injectable()
export class ListSalesOpportunityHistoryUseCase implements IUseCase<
  ListSalesOpportunityHistoryDto,
  SalesOpportunityHistory[]
> {
  constructor(private readonly repository: SalesOpportunityRepository) {}

  async execute(
    dto: ListSalesOpportunityHistoryDto,
  ): Promise<SalesOpportunityHistory[]> {
    const opportunity = await this.repository.findById(
      dto.storeId,
      dto.opportunityId,
    );
    if (!opportunity) {
      throw new SalesOpportunityNotFoundError(
        ListSalesOpportunityHistoryUseCase.name,
        dto.opportunityId,
      );
    }
    return this.repository.listHistory(dto.storeId, dto.opportunityId);
  }
}
