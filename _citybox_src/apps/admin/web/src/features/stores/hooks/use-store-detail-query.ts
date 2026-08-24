'use client';

import { useQuery } from '@tanstack/react-query';
import { storesKeys } from '../api/query-keys';
import { getStoreDetail } from '../api/stores-api';

export function useStoreDetailQuery(id: string, options?: { enabled?: boolean }) {
  const query = useQuery({
    queryKey: storesKeys.detail(id),
    queryFn: () => getStoreDetail(id),
    enabled: (options?.enabled ?? true) && Boolean(id),
  });

  return {
    detail: query.data,
    isPending: query.isPending,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
