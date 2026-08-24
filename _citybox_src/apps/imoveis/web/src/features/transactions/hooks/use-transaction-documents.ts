'use client';

import { useQuery } from '@tanstack/react-query';
import { getTransactionDocuments } from '../services/transactions-service';
import { transactionKeys } from './query-keys';

export function useTransactionDocuments(id: string | undefined) {
  return useQuery({
    queryKey: transactionKeys.documents(id ?? ''),
    queryFn: () => getTransactionDocuments(id!),
    enabled: Boolean(id),
    retry: 1,
  });
}
