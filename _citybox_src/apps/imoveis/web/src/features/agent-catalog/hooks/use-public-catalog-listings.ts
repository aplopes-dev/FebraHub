'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDebouncedValue } from '@/features/leads/hooks/use-debounced-value';
import {
  buildPerPageOptions,
  DEFAULT_PER_PAGE,
} from '@/features/shared/utils/build-per-page-options';
import { listPublicAgentListings } from '../services/agent-catalog-client-service';
import type { CatalogListingsMeta } from '../services/agent-catalog-mappers';
import type { CatalogFilter, CatalogListing } from '../types';

type UsePublicCatalogListingsArgs = {
  agentSlug: string;
  initialListings: readonly CatalogListing[];
  initialMeta: CatalogListingsMeta;
  initialFilter?: CatalogFilter;
  initialSearch?: string;
};

/**
 * Listagem pública paginada no padrão Listify (`page`/`perPage` no backend).
 */
export function usePublicCatalogListings({
  agentSlug,
  initialListings,
  initialMeta,
  initialFilter = { purpose: 'all', type: 'all' },
  initialSearch = '',
}: UsePublicCatalogListingsArgs) {
  const [filter, setFilter] = useState<CatalogFilter>(initialFilter);
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [listings, setListings] = useState<readonly CatalogListing[]>(initialListings);
  const [meta, setMeta] = useState<CatalogListingsMeta>(initialMeta);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 400);
  const searchTerm = debouncedSearch.trim();

  useEffect(() => {
    setListings(initialListings);
    setMeta(initialMeta);
  }, [initialListings, initialMeta]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    void (async () => {
      try {
        const result = await listPublicAgentListings(agentSlug, {
          page,
          perPage,
          search: searchTerm || undefined,
          purpose: filter.purpose,
          type: filter.type,
        });
        if (cancelled) return;
        setListings(result.listings);
        setMeta(result.meta);
      } catch (error) {
        if (cancelled) return;
        console.error('[usePublicCatalogListings] Failed to load listings:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    agentSlug,
    page,
    perPage,
    filter.purpose,
    filter.type,
    searchTerm,
  ]);

  const perPageOptions = useMemo(
    () => buildPerPageOptions(meta.total),
    [meta.total],
  );

  useEffect(() => {
    if (!perPageOptions.includes(perPage)) {
      setPerPage(perPageOptions[0] ?? DEFAULT_PER_PAGE);
      setPage(1);
    }
  }, [perPageOptions, perPage]);

  function handlePurposeChange(purpose: CatalogFilter['purpose']) {
    setFilter((current) => ({ ...current, purpose }));
    setPage(1);
  }

  function handleTypeChange(type: CatalogFilter['type']) {
    setFilter((current) => ({ ...current, type }));
    setPage(1);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handlePerPageChange(next: number) {
    setPerPage(next);
    setPage(1);
  }

  return {
    filter,
    search,
    searchTerm,
    page,
    perPage,
    listings,
    meta,
    isLoading,
    perPageOptions,
    handlePurposeChange,
    handleTypeChange,
    handleSearchChange,
    setPage,
    handlePerPageChange,
  };
}
