import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { LeadEntity } from '../../../domain/entities/lead.entity';
import {
  LeadRepository,
  type ListLeadsFilters,
} from '../../../domain/repositories/lead.repository.interface';
import {
  parseCsvPropertyTypes,
  parseCsvPurposes,
  parseCsvSources,
  parseCsvStatuses,
} from '../../../domain/mappers/lead-enum.mapper';

export type ListLeadsInput = {
  storeId: string;
  page?: number;
  perPage?: number;
  search?: string;
  status?: string[];
  leadSource?: string[];
  purpose?: string[];
  interestedPropertyType?: string[];
  agentId?: string;
  /** `YYYY-MM-DD` — retorno devido até esta data (inclusive). */
  followUpUntil?: string;
};

/** `YYYY-MM-DD` → `Date` em UTC; formato inválido é erro de filtro. */
function parseDateOnly(value?: string): Date | undefined {
  const raw = value?.trim();
  if (!raw) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new Error(`Invalid date filter: ${raw}`);
  }
  const date = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date filter: ${raw}`);
  }
  return date;
}

export type ListLeadsOutput = {
  items: LeadEntity[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

@Injectable()
export class ListLeadsUseCase implements IUseCase<
  ListLeadsInput,
  ListLeadsOutput
> {
  constructor(private readonly leads: LeadRepository) {}

  async execute(input: ListLeadsInput): Promise<ListLeadsOutput> {
    const page = Math.max(1, Number(input.page ?? 1) || 1);
    const perPage = Math.min(200, Math.max(1, Number(input.perPage ?? 9) || 9));

    let filters: ListLeadsFilters;
    try {
      filters = {
        page,
        perPage,
        search: input.search?.trim() || undefined,
        status: parseCsvStatuses(input.status),
        leadSource: parseCsvSources(input.leadSource),
        purpose: parseCsvPurposes(input.purpose),
        interestedPropertyType: parseCsvPropertyTypes(
          input.interestedPropertyType,
        ),
        agentId: input.agentId?.trim() || undefined,
        followUpUntil: parseDateOnly(input.followUpUntil),
      };
    } catch (err) {
      throw new ValidatorDomainError({
        internalMessage: err instanceof Error ? err.message : 'Invalid filters',
        externalMessage: 'Filtros de listagem inválidos.',
        context: 'ListLeadsUseCase',
      });
    }

    const { items, total } = await this.leads.findMany(input.storeId, filters);
    const totalPages = Math.max(1, Math.ceil(total / perPage));

    return { items, total, page, perPage, totalPages };
  }
}
