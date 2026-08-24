import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { DealEntity } from '../../../domain/entities/deal.entity';
import { DealNotFoundError } from '../../../domain/errors/deal-not-found.error';
import { DealRepository } from '../../../domain/repositories/deal.repository.interface';

@Injectable()
export class GetDealByIdUseCase implements IUseCase<
  { storeId: string; id: string },
  DealEntity
> {
  constructor(private readonly deals: DealRepository) {}

  async execute({
    storeId,
    id,
  }: {
    storeId: string;
    id: string;
  }): Promise<DealEntity> {
    const deal = await this.deals.findById(storeId, id);
    if (!deal) throw new DealNotFoundError(id);
    return deal;
  }
}
