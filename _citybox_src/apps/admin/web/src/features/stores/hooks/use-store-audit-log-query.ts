'use client';

import { useQuery } from '@tanstack/react-query';
import { storesKeys } from '../api/query-keys';
import { listStoreAuditLog, type StoreAuditLogParams } from '../api/stores-api';

export function useStoreAuditLogQuery(storeId: string, params: StoreAuditLogParams) {
  const query = useQuery({
    queryKey: storesKeys.auditLog(storeId, params),
    queryFn: () => listStoreAuditLog(storeId, params),
    enabled: Boolean(storeId),
  });

  return {
    entries: query.data?.data ?? [],
    meta: query.data?.meta,
    isPending: query.isPending,
    error: query.error,
    refetch: query.refetch,
  };
}
