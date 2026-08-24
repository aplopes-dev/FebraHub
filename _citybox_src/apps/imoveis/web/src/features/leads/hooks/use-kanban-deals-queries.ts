'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { listDeals } from '../services/deals-service';
import {
  DEAL_KANBAN_STAGES,
  type DealDetail,
  type DealStage,
  type ListDealsParams,
} from '../types';
import { dealKeys } from './query-keys';

/** Cards carregados por fatia em cada coluna; “Ver mais” pede a próxima. */
export const KANBAN_COLUMN_PAGE_SIZE = 10;

export type KanbanDealsColumnFilters = Omit<
  ListDealsParams,
  'stage' | 'page' | 'perPage'
>;

export type KanbanDealsColumnState = {
  items: readonly DealDetail[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  isFetching: boolean;
};

const INITIAL_PAGES = Object.fromEntries(
  DEAL_KANBAN_STAGES.map((stage) => [stage, 1]),
) as Record<DealStage, number>;

/** Negócios visíveis no funil (ativos + ganhos na coluna Entrega). */
const KANBAN_DEAL_STATUSES = ['active', 'won'] as const;

export function useKanbanDealsQueries(
  baseFilters: KanbanDealsColumnFilters,
  enabled = true,
) {
  const [columnPages, setColumnPages] =
    useState<Record<DealStage, number>>(INITIAL_PAGES);

  const resetPages = useCallback(() => {
    setColumnPages({ ...INITIAL_PAGES });
  }, []);

  const filtersKey = JSON.stringify(baseFilters);
  useEffect(() => {
    resetPages();
  }, [filtersKey, resetPages]);

  const queries = useQueries({
    queries: DEAL_KANBAN_STAGES.map((stage) => {
      const loadedPages = columnPages[stage];
      const params: ListDealsParams = {
        ...baseFilters,
        stage: [stage],
        status: [...KANBAN_DEAL_STATUSES],
        page: 1,
        // Cresce o perPage até cobrir as fatias pedidas (API limita em MAX_PER_PAGE).
        perPage: loadedPages * KANBAN_COLUMN_PAGE_SIZE,
      };
      return {
        queryKey: dealKeys.list(params),
        queryFn: () => listDeals(params),
        enabled,
        placeholderData: (prev: Awaited<ReturnType<typeof listDeals>> | undefined) =>
          prev,
      };
    }),
  });

  const loadMore = useCallback((stage: DealStage, _totalInColumn?: number) => {
    setColumnPages((prev) => ({
      ...prev,
      [stage]: prev[stage] + 1,
    }));
  }, []);

  const columns = useMemo(() => {
    const next = {} as Record<DealStage, KanbanDealsColumnState>;
    DEAL_KANBAN_STAGES.forEach((stage, index) => {
      const query = queries[index];
      const data = query?.data;
      const rawItems = data?.data ?? [];
      const seen = new Set<string>();
      const items: DealDetail[] = [];
      for (const deal of rawItems) {
        if (seen.has(deal.id)) continue;
        seen.add(deal.id);
        items.push(deal);
      }
      const total = data?.meta.total ?? 0;
      next[stage] = {
        items,
        total,
        hasMore: items.length < total,
        isLoading: query?.isLoading ?? false,
        isFetching: query?.isFetching ?? false,
      };
    });
    return next;
  }, [queries]);

  const allDeals = useMemo(() => {
    const byId = new Map<string, DealDetail>();
    for (const stage of DEAL_KANBAN_STAGES) {
      for (const deal of columns[stage].items) {
        const existing = byId.get(deal.id);
        if (!existing) {
          byId.set(deal.id, deal);
          continue;
        }
        if (deal.stage === stage && existing.stage !== stage) {
          byId.set(deal.id, deal);
        }
      }
    }
    return Array.from(byId.values());
  }, [columns]);

  const isLoading = queries.some((query) => query.isLoading && !query.data);
  const isFetching = queries.some((query) => query.isFetching);

  return {
    columns,
    allDeals,
    loadMore,
    resetPages,
    isLoading,
    isFetching,
  };
}
