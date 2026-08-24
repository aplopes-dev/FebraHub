import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { buildTsquery } from '../../policies/build-tsquery';
import { SearchRepository } from '../../../infrastructure/database/search.repository';
import type {
  SearchHitRow,
  SearchHitType,
} from '../../../infrastructure/database/search.repository';

export type GlobalSearchGroup = {
  heading: string;
  hits: SearchHitRow[];
};

export type GlobalSearchResult = {
  groups: GlobalSearchGroup[];
};

export type GlobalSearchInput = {
  storeId: string;
  q: string;
  perType?: number;
  agentId?: string;
};

const HEADING_BY_TYPE: Record<SearchHitType, string> = {
  lead: 'Leads',
  property: 'Imóveis',
  appointment: 'Agenda',
  transaction: 'Negócios',
};

const TYPE_ORDER: readonly SearchHitType[] = [
  'lead',
  'property',
  'transaction',
  'appointment',
];

const DEFAULT_PER_TYPE = 15;
const MAX_PER_TYPE = 30;

@Injectable()
export class GlobalSearchUseCase implements IUseCase<
  GlobalSearchInput,
  GlobalSearchResult
> {
  constructor(private readonly search: SearchRepository) {}

  async execute(input: GlobalSearchInput): Promise<GlobalSearchResult> {
    const q = input.q?.trim() ?? '';
    if (!q) {
      return { groups: [] };
    }

    const tsq = buildTsquery(q);
    if (!tsq) {
      return { groups: [] };
    }

    const perType = Math.min(
      MAX_PER_TYPE,
      Math.max(1, input.perType ?? DEFAULT_PER_TYPE),
    );

    const rows = await this.search.search(
      input.storeId,
      tsq,
      perType,
      input.agentId,
    );

    const byType = new Map<SearchHitType, SearchHitRow[]>();
    for (const row of rows) {
      const list = byType.get(row.type) ?? [];
      list.push(row);
      byType.set(row.type, list);
    }

    const groups: GlobalSearchGroup[] = [];
    for (const type of TYPE_ORDER) {
      const hits = byType.get(type);
      if (!hits || hits.length === 0) continue;
      groups.push({
        heading: HEADING_BY_TYPE[type],
        hits,
      });
    }

    return { groups };
  }
}
