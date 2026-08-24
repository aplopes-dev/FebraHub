'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { usersKeys } from '../api/query-keys';
import { listUsers, type UsersListParams } from '../api/users-api';

export function useUsersQuery(params: UsersListParams) {
  const query = useQuery({
    queryKey: usersKeys.list(params),
    queryFn: () => listUsers(params),
    placeholderData: keepPreviousData,
  });

  return {
    users: query.data?.data ?? [],
    total: query.data?.meta.total ?? 0,
    isPending: query.isPending,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
