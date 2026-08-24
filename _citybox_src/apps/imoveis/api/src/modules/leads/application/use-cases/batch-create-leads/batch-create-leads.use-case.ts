import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { CreateLeadUseCase } from '../create-lead/create-lead.use-case';

export type BatchCreateLeadItem = {
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
};

export type BatchCreateLeadsInput = {
  storeId: string;
  /** Corretor da sessão JWT — dono dos leads importados. */
  assignedAgentId: string;
  leads: BatchCreateLeadItem[];
};

export type BatchCreateLeadsOutput = {
  successCount: number;
  skippedCount: number;
};

const MAX_BATCH = 500;

/**
 * Importação em lote (CSV). Defaults:
 * - status `new`, origem `walk-in`, tipo `apartment`, purpose `buying`
 * - agentIds/agentId = corretor da sessão
 */
@Injectable()
export class BatchCreateLeadsUseCase implements IUseCase<
  BatchCreateLeadsInput,
  BatchCreateLeadsOutput
> {
  constructor(private readonly createLead: CreateLeadUseCase) {}

  async execute(input: BatchCreateLeadsInput): Promise<BatchCreateLeadsOutput> {
    const agentId = input.assignedAgentId.trim();
    if (!agentId) {
      throw new ValidatorDomainError({
        internalMessage: 'Missing assignedAgentId on batch create leads',
        externalMessage:
          'Não foi possível identificar o corretor da sessão para importar leads.',
        context: BatchCreateLeadsUseCase.name,
      });
    }

    if (input.leads.length > MAX_BATCH) {
      throw new ValidatorDomainError({
        internalMessage: `Batch size ${input.leads.length} exceeds ${MAX_BATCH}`,
        externalMessage: `Limite de ${MAX_BATCH} leads por importação.`,
        context: BatchCreateLeadsUseCase.name,
      });
    }

    let successCount = 0;
    let skippedCount = 0;

    for (const raw of input.leads) {
      const name = raw.name?.trim() ?? '';
      if (!name) {
        skippedCount += 1;
        continue;
      }

      await this.createLead.execute({
        storeId: input.storeId,
        name,
        phone: raw.phone?.trim() || undefined,
        email: raw.email?.trim() || undefined,
        notes: raw.notes?.trim() || undefined,
        status: 'new',
        leadSource: 'walk-in',
        interestedPropertyType: 'apartment',
        purpose: 'buying',
        agentId,
        agentIds: [agentId],
      });
      successCount += 1;
    }

    return { successCount, skippedCount };
  }
}
