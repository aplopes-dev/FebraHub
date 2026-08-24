'use client';

import { useQuery } from '@tanstack/react-query';
import { useStore } from '@/lib/store-context';
import {
  listReportApprovedBudgets,
  type ReportApprovedBudgetsListParams,
} from '../services/reports-approved-budgets.service';
import { reportKeys } from './query-keys';
import { REPORT_QUERY_WITH_PLACEHOLDER } from '../lib/report-query-options';

export function useReportApprovedBudgetsQuery(
  params: ReportApprovedBudgetsListParams,
  enabled = true,
) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: reportKeys.approvedBudgets(storeId ?? '', params),
    queryFn: () => listReportApprovedBudgets(storeId!, params),
    enabled: Boolean(storeId) && enabled,
    ...REPORT_QUERY_WITH_PLACEHOLDER,
  });
}
