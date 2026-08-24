'use client';

import { useQuery } from '@tanstack/react-query';
import { storesKeys } from '../api/query-keys';
import { listStoreMemberRoles } from '../api/stores-api';

export function useStoreMemberRolesQuery(storeId: string, enabled = true) {
  const query = useQuery({
    queryKey: storesKeys.memberRoles(storeId),
    queryFn: () => listStoreMemberRoles(storeId),
    enabled: enabled && Boolean(storeId),
  });

  return {
    roles: query.data ?? [],
    isPending: query.isPending,
    error: query.error,
  };
}
