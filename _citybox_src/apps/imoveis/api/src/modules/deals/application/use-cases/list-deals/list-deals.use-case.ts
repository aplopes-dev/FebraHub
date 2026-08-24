import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type {
  DealEntity,
  DealStage,
  DealStatus,
} from '../../../domain/entities/deal.entity';
import { DealRepository } from '../../../domain/repositories/deal.repository.interface';

export type ListDealsInput = {
  storeId: string;
  page?: number;
  perPage?: number;
  search?: string;
  leadId?: string;
  propertyId?: string;
  status?: string[];
  stage?: string[];
  agentId?: string;
};

export type ListDealsOutput = {
  items: DealEntity[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 20;
/** Kanban carrega a coluna inteira em uma query (perPage crescente). */
const MAX_PER_PAGE = 500;

const DEAL_STATUSES: DealStatus[] = ['active', 'won', 'cancelled'];
const DEAL_STAGES: DealStage[] = [
  'awaiting_property',
  'property_selected',
  'contract_sent',
  'contract_signed',
  'payment_confirmed',
  'handover',
];

function parseEnumList<T extends string>(
  values: string[] | undefined,
  allowed: readonly T[],
): T[] | undefined {
  if (!values?.length) return undefined;
  return values.filter((v): v is T => allowed.includes(v as T));
}

@Injectable()
export class ListDealsUseCase implements IUseCase<
  ListDealsInput,
  ListDealsOutput
> {
  constructor(private readonly deals: DealRepository) {}

  async execute(input: ListDealsInput): Promise<ListDealsOutput> {
    const page = Math.max(1, input.page ?? DEFAULT_PAGE);
    const perPage = Math.min(
      MAX_PER_PAGE,
      Math.max(1, input.perPage ?? DEFAULT_PER_PAGE),
    );

    const result = await this.deals.findMany(input.storeId, {
      page,
      perPage,
      search: input.search,
      leadId: input.leadId,
      propertyId: input.propertyId,
      agentId: input.agentId,
      status: parseEnumList(input.status, DEAL_STATUSES),
      stage: parseEnumList(input.stage, DEAL_STAGES),
    });

    return {
      items: result.items,
      total: result.total,
      page,
      perPage,
      totalPages: Math.max(1, Math.ceil(result.total / perPage)),
    };
  }
}
