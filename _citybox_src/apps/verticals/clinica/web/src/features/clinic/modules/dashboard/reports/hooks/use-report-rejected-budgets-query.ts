'use client';

import { useQuery } from '@tanstack/react-query';
import { useStore } from '@/lib/store-context';
import {
  listReportRejectedBudgets,
  type ReportRejectedBudgetsListParams,
} from '../services/reports-rejected-budgets.service';
import { reportKeys } from './query-keys';
import { REPORT_QUERY_WITH_PLACEHOLDER } from '../lib/report-query-options';

export function useReportRejectedBudgetsQuery(
  params: ReportRejectedBudgetsListParams,
  enabled = true,
) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: reportKeys.rejectedBudgets(storeId ?? '', params),
    queryFn: () => listReportRejectedBudgets(storeId!, params),
    enabled: Boolean(storeId) && enabled,
    ...REPORT_QUERY_WITH_PLACEHOLDER,
  });
}
