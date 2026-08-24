import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { LeadNotFoundError } from '../../../domain/errors/lead-not-found.error';
import { LeadRepository } from '../../../domain/repositories/lead.repository.interface';

@Injectable()
export class DeleteLeadUseCase implements IUseCase<
  { storeId: string; id: string },
  void
> {
  constructor(private readonly leads: LeadRepository) {}

  async execute({
    storeId,
    id,
  }: {
    storeId: string;
    id: string;
  }): Promise<void> {
    const ok = await this.leads.delete(storeId, id);
    if (!ok) throw new LeadNotFoundError(id);
  }
}
