import { keepPreviousData } from '@tanstack/react-query';

/**
 * Freshness dos cards do dashboard: dados sempre stale → refetch ao montar/focar.
 * `placeholderData` (quando usado) evita flicker enquanto o refetch corre.
 */
export const DASHBOARD_QUERY_FRESHNESS = {
  staleTime: 0,
  gcTime: 60_000,
  refetchOnMount: 'always' as const,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
};

export const DASHBOARD_QUERY_WITH_PLACEHOLDER = {
  ...DASHBOARD_QUERY_FRESHNESS,
  placeholderData: keepPreviousData,
};
