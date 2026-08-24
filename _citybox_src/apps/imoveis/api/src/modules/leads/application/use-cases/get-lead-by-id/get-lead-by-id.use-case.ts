import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { LeadEntity } from '../../../domain/entities/lead.entity';
import { LeadNotFoundError } from '../../../domain/errors/lead-not-found.error';
import { LeadRepository } from '../../../domain/repositories/lead.repository.interface';

@Injectable()
export class GetLeadByIdUseCase implements IUseCase<
  { storeId: string; id: string },
  LeadEntity
> {
  constructor(private readonly leads: LeadRepository) {}

  async execute({
    storeId,
    id,
  }: {
    storeId: string;
    id: string;
  }): Promise<LeadEntity> {
    const lead = await this.leads.findById(storeId, id);
    if (!lead) throw new LeadNotFoundError(id);
    return lead;
  }
}
