'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebouncedValue } from '@/features/leads/hooks/use-debounced-value';
import type { NavItem } from '@/features/shared/data/navigation';
import { useSessionPermissions } from '@/features/settings/hooks/use-session-permissions';
import { globalSearch } from '../services/global-search-service';
import type { GlobalSearchResult } from '../types';

export const globalSearchKeys = {
  all: ['global-search'] as const,
  query: (q: string, accessKey: string) =>
    [...globalSearchKeys.all, q, accessKey] as const,
};

export function useGlobalSearchDialog(navItems: readonly NavItem[]) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 400);
  const { canNav, canPath, canSettings, revision } = useSessionPermissions();

  const canAccessHref = useCallback(
    (href: string) => {
      const [pathPart, query = ''] = href.split('?');
      const path = pathPart ?? href;
      if (path === '/settings' || path.startsWith('/settings')) {
        if (!canPath('/settings')) return false;
        const section = new URLSearchParams(query).get('section');
        if (
          section === 'profile' ||
          section === 'privacy' ||
          section === 'notifications' ||
          section === 'users' ||
          section === 'system' ||
          section === 'billing' ||
          section === 'delete-account'
        ) {
          return canSettings(section);
        }
        return true;
      }
      if (path === '/help' || path.startsWith('/help')) {
        return canPath('/help');
      }
      if (path.startsWith('/transactions/finance')) {
        return canNav('/transactions') || canPath('/transactions/finance');
      }
      if (path === '/leads/new') return canNav('/leads');
      if (path === '/properties/new') return canNav('/properties');
      return canNav(path) || canPath(path);
    },
    [canNav, canPath, canSettings],
  );

  const enabled = open;

  const searchQuery = useQuery({
    queryKey: globalSearchKeys.query(
      debouncedQuery.trim(),
      String(revision),
    ),
    queryFn: () =>
      globalSearch(debouncedQuery, navItems, { canAccessHref }),
    enabled,
    placeholderData: (prev) => prev,
  });

  const result: GlobalSearchResult = useMemo(() => {
    if (searchQuery.data) return searchQuery.data;
    return { groups: [] };
  }, [searchQuery.data]);

  const isFetching =
    searchQuery.isFetching &&
    query.trim() === debouncedQuery.trim();

  return {
    open,
    setOpen,
    query,
    setQuery,
    result,
    isLoading: isFetching || (searchQuery.isLoading && enabled),
    onOpenChange: (next: boolean) => {
      setOpen(next);
      if (!next) setQuery('');
    },
  };
}
