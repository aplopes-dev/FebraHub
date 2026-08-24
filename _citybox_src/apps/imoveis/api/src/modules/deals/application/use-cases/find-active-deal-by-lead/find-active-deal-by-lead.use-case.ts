import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { DealEntity } from '../../../domain/entities/deal.entity';
import { DealRepository } from '../../../domain/repositories/deal.repository.interface';

@Injectable()
export class FindActiveDealByLeadUseCase implements IUseCase<
  { storeId: string; leadId: string },
  DealEntity | null
> {
  constructor(private readonly deals: DealRepository) {}

  async execute({
    storeId,
    leadId,
  }: {
    storeId: string;
    leadId: string;
  }): Promise<DealEntity | null> {
    return this.deals.findActiveByLeadId(storeId, leadId);
  }
}
