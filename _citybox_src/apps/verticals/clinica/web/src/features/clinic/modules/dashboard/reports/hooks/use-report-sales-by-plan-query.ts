'use client';

import { useQuery } from '@tanstack/react-query';
import { useStore } from '@/lib/store-context';
import {
  listReportSalesByPlan,
  type ReportSalesByPlanListParams,
} from '../services/reports-sales-by-plan.service';
import { reportKeys } from './query-keys';
import { REPORT_QUERY_WITH_PLACEHOLDER } from '../lib/report-query-options';

export function useReportSalesByPlanQuery(
  params: ReportSalesByPlanListParams,
  enabled = true,
) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: reportKeys.salesByPlan(storeId ?? '', params),
    queryFn: () => listReportSalesByPlan(storeId!, params),
    enabled: Boolean(storeId) && enabled,
    ...REPORT_QUERY_WITH_PLACEHOLDER,
  });
}
