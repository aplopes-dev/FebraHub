'use client';

import { useQuery } from '@tanstack/react-query';
import { useStore } from '@/lib/store-context';
import {
  listReportExpensesByCategory,
  type ReportExpensesByCategoryListParams,
} from '../services/reports-expenses-by-category.service';
import { reportKeys } from './query-keys';
import { REPORT_QUERY_WITH_PLACEHOLDER } from '../lib/report-query-options';

export function useReportExpensesByCategoryQuery(
  params: ReportExpensesByCategoryListParams,
  enabled = true,
) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: reportKeys.expensesByCategory(storeId ?? '', params),
    queryFn: () => listReportExpensesByCategory(storeId!, params),
    enabled: Boolean(storeId) && enabled,
    ...REPORT_QUERY_WITH_PLACEHOLDER,
  });
}
