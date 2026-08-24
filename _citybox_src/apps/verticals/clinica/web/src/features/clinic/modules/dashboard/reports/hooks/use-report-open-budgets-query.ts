'use client';

import { useQuery } from '@tanstack/react-query';
import { useStore } from '@/lib/store-context';
import {
  listReportOpenBudgets,
  type ReportOpenBudgetsListParams,
} from '../services/reports-open-budgets.service';
import { reportKeys } from './query-keys';
import { REPORT_QUERY_WITH_PLACEHOLDER } from '../lib/report-query-options';

export function useReportOpenBudgetsQuery(
  params: ReportOpenBudgetsListParams,
  enabled = true,
) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: reportKeys.openBudgets(storeId ?? '', params),
    queryFn: () => listReportOpenBudgets(storeId!, params),
    enabled: Boolean(storeId) && enabled,
    ...REPORT_QUERY_WITH_PLACEHOLDER,
  });
}
