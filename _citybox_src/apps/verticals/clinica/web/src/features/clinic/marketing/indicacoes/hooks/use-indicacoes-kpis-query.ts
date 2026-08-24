'use client';

import { useQuery } from '@tanstack/react-query';
import { useStore } from '@/lib/store-context';
import {
  getIndicacoesKpis,
  type IndicacoesPeriodParams,
} from '../services/indicacoes.api.service';
import { indicacoesKeys } from './query-keys';

export function useIndicacoesKpisQuery(
  params: IndicacoesPeriodParams,
  enabled = true,
) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: indicacoesKeys.kpis(storeId ?? '', params),
    queryFn: () => getIndicacoesKpis(storeId!, params),
    enabled: Boolean(storeId) && enabled,
  });
}
