import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../../shared/core/use-case.interface';

import type { SalesOpportunity } from '../../../domain/entities/sales-opportunity.entity';
import { SalesOpportunityNotFoundError } from '../../../domain/errors/sales-opportunity-not-found.error';
import { SalesOpportunityRepository } from '../../../domain/repositories/sales-opportunity.repository';

export type GetSalesOpportunityDto = {
  storeId: string;
  id: string;
};

@Injectable()
export class GetSalesOpportunityUseCase implements IUseCase<
  GetSalesOpportunityDto,
  SalesOpportunity
> {
  constructor(private readonly repository: SalesOpportunityRepository) {}

  async execute(dto: GetSalesOpportunityDto): Promise<SalesOpportunity> {
    const opportunity = await this.repository.findById(dto.storeId, dto.id);
    if (!opportunity) {
      throw new SalesOpportunityNotFoundError(
        GetSalesOpportunityUseCase.name,
        dto.id,
      );
    }
    return opportunity;
  }
}
