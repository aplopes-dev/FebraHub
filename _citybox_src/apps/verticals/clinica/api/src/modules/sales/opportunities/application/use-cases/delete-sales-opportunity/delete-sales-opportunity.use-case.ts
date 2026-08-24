import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../../shared/core/use-case.interface';

import { SalesOpportunityNotFoundError } from '../../../domain/errors/sales-opportunity-not-found.error';
import { SalesOpportunityRepository } from '../../../domain/repositories/sales-opportunity.repository';

export type DeleteSalesOpportunityDto = {
  storeId: string;
  id: string;
};

@Injectable()
export class DeleteSalesOpportunityUseCase implements IUseCase<
  DeleteSalesOpportunityDto,
  void
> {
  constructor(private readonly repository: SalesOpportunityRepository) {}

  async execute(dto: DeleteSalesOpportunityDto): Promise<void> {
    const opportunity = await this.repository.findById(dto.storeId, dto.id);
    if (!opportunity) {
      throw new SalesOpportunityNotFoundError(
        DeleteSalesOpportunityUseCase.name,
        dto.id,
      );
    }
    await this.repository.delete(dto.storeId, dto.id);
  }
}
