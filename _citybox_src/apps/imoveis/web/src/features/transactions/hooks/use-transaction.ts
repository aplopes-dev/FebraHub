'use client';

import { useQuery } from '@tanstack/react-query';
import { getTransactionById } from '../services/transactions-service';
import { transactionKeys } from './query-keys';

export function useTransaction(id: string | undefined) {
  return useQuery({
    queryKey: transactionKeys.detail(id ?? ''),
    queryFn: () => getTransactionById(id!),
    enabled: Boolean(id),
  });
}
