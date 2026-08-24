import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { LeadRepository } from '../../../domain/repositories/lead.repository.interface';

export type SyncAgentCatalogLeadsInput = {
  storeId: string;
  agentId: string;
  leadIds: string[];
  fallbackAgentId?: string;
};

@Injectable()
export class SyncAgentCatalogLeadsUseCase implements IUseCase<
  SyncAgentCatalogLeadsInput,
  void
> {
  constructor(private readonly leads: LeadRepository) {}

  async execute({
    storeId,
    agentId,
    leadIds,
    fallbackAgentId,
  }: SyncAgentCatalogLeadsInput): Promise<void> {
    await this.leads.syncAgentCatalog(
      storeId,
      agentId,
      leadIds,
      fallbackAgentId ?? 'bruno-costa',
    );
  }
}
