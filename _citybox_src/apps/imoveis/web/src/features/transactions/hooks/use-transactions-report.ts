'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getTransactionsReport,
  type TransactionsReportPeriod,
} from '../services/reports-service';
import { transactionKeys } from './query-keys';

export function useTransactionsReport(period?: TransactionsReportPeriod) {
  return useQuery({
    queryKey: transactionKeys.report(period),
    queryFn: () => getTransactionsReport(period),
  });
}
