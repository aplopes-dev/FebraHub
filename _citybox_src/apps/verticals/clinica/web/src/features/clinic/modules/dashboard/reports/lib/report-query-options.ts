import { keepPreviousData } from '@tanstack/react-query';

/**
 * Freshness dos relatórios: sempre stale → refetch ao montar/focar.
 * `placeholderData` evita flicker ao mudar página/período.
 */
export const REPORT_QUERY_FRESHNESS = {
  staleTime: 0,
  gcTime: 60_000,
  refetchOnMount: 'always' as const,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
};

export const REPORT_QUERY_WITH_PLACEHOLDER = {
  ...REPORT_QUERY_FRESHNESS,
  placeholderData: keepPreviousData,
};
