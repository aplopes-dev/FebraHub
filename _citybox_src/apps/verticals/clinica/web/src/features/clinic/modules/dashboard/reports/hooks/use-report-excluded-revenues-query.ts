'use client';

import { useQuery } from '@tanstack/react-query';
import { useStore } from '@/lib/store-context';
import {
  listReportExcludedRevenues,
  type ReportExcludedRevenuesListParams,
} from '../services/reports-excluded-revenues.service';
import { reportKeys } from './query-keys';
import { REPORT_QUERY_WITH_PLACEHOLDER } from '../lib/report-query-options';

export function useReportExcludedRevenuesQuery(
  params: ReportExcludedRevenuesListParams,
  enabled = true,
) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: reportKeys.excludedRevenues(storeId ?? '', params),
    queryFn: () => listReportExcludedRevenues(storeId!, params),
    enabled: Boolean(storeId) && enabled,
    ...REPORT_QUERY_WITH_PLACEHOLDER,
  });
}
