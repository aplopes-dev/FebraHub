'use client';

import { useQuery } from '@tanstack/react-query';
import { useStore } from '@/lib/store-context';
import { contractModelKeys } from './query-keys';
import { listContractModels } from '../services/contract-models.service';

export function useContractModelsQuery() {
  const { storeId } = useStore();
  return useQuery({
    queryKey: contractModelKeys.list(storeId),
    queryFn: () => listContractModels(storeId),
    enabled: Boolean(storeId),
  });
}
