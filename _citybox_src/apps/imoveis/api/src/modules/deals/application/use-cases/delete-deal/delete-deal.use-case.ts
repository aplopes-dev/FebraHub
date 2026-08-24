import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { DealNotFoundError } from '../../../domain/errors/deal-not-found.error';
import { DealRepository } from '../../../domain/repositories/deal.repository.interface';

@Injectable()
export class DeleteDealUseCase implements IUseCase<
  { storeId: string; id: string },
  void
> {
  constructor(private readonly deals: DealRepository) {}

  async execute({
    storeId,
    id,
  }: {
    storeId: string;
    id: string;
  }): Promise<void> {
    const ok = await this.deals.delete(storeId, id);
    if (!ok) throw new DealNotFoundError(id);
  }
}
