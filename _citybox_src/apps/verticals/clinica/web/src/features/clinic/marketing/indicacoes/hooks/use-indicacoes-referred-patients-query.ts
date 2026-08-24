'use client';

import { useQuery } from '@tanstack/react-query';
import { useStore } from '@/lib/store-context';
import {
  listIndicacoesReferredPatients,
  type ListIndicacoesReferredPatientsParams,
} from '../services/indicacoes.api.service';
import { indicacoesKeys } from './query-keys';

export function useIndicacoesReferredPatientsQuery(
  params: ListIndicacoesReferredPatientsParams,
  enabled = true,
) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: indicacoesKeys.referredPatients(storeId ?? '', params),
    queryFn: () => listIndicacoesReferredPatients(storeId!, params),
    enabled: Boolean(storeId) && enabled,
  });
}
