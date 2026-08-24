'use client';

import { useQuery } from '@tanstack/react-query';
import { listTransactions } from '../services/transactions-service';
import type { ListTransactionsParams } from '../types';
import { transactionKeys } from './query-keys';

export function useTransactions(params: ListTransactionsParams = {}) {
  return useQuery({
    queryKey: transactionKeys.list(params as Record<string, unknown>),
    queryFn: () => listTransactions(params),
  });
}
