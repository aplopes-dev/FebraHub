'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { storesKeys } from '../api/query-keys';
import { listStores, type StoresListParams } from '../api/stores-api';

export function useStoresQuery(params: StoresListParams) {
  const query = useQuery({
    queryKey: storesKeys.list(params),
    queryFn: () => listStores(params),
    placeholderData: keepPreviousData,
  });

  return {
    lojas: query.data?.data ?? [],
    total: query.data?.meta.total ?? 0,
    isPending: query.isPending,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
