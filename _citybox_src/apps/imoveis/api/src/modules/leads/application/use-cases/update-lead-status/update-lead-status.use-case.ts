import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { LeadEntity } from '../../../domain/entities/lead.entity';
import { LeadNotFoundError } from '../../../domain/errors/lead-not-found.error';
import { LeadRepository } from '../../../domain/repositories/lead.repository.interface';
import type { ApiLeadStatus } from '../../../domain/mappers/lead-enum.mapper';
import { SyncActiveDealForLeadUseCase } from '../../../../deals/application/use-cases/sync-active-deal-for-lead/sync-active-deal-for-lead.use-case';

const STATUS_LABEL: Record<ApiLeadStatus, string> = {
  new: 'Novo',
  negotiating: 'Em negociação',
  'scheduled-visit': 'Visita agendada',
  'closed-won': 'Fechado',
  cancelled: 'Cancelado',
};

@Injectable()
export class UpdateLeadStatusUseCase implements IUseCase<
  { storeId: string; id: string; status: ApiLeadStatus },
  LeadEntity
> {
  constructor(
    private readonly leads: LeadRepository,
    private readonly syncActiveDeal: SyncActiveDealForLeadUseCase,
  ) {}

  async execute({
    storeId,
    id,
    status,
  }: {
    storeId: string;
    id: string;
    status: ApiLeadStatus;
  }): Promise<LeadEntity> {
    const message = `Status alterado para ${STATUS_LABEL[status]}.`;
    const lead = await this.leads.updateStatus(storeId, id, status, message);
    if (!lead) throw new LeadNotFoundError(id);
    await this.syncActiveDeal.execute(lead);
    return lead;
  }
}
