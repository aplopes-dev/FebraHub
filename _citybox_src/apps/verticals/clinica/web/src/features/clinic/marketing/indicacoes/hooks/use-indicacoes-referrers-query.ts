'use client';

import { useQuery } from '@tanstack/react-query';
import { useStore } from '@/lib/store-context';
import {
  listIndicacoesReferrers,
  type ListIndicacoesReferrersParams,
} from '../services/indicacoes.api.service';
import { indicacoesKeys } from './query-keys';

export function useIndicacoesReferrersQuery(
  params: ListIndicacoesReferrersParams,
  enabled = true,
) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: indicacoesKeys.referrers(storeId ?? '', params),
    queryFn: () => listIndicacoesReferrers(storeId!, params),
    enabled: Boolean(storeId) && enabled,
  });
}
