'use client';

import { useQuery } from '@tanstack/react-query';
import { useStore } from '@/lib/store-context';
import {
  listReportSalesByTreatment,
  type ReportSalesByTreatmentListParams,
} from '../services/reports-sales-by-treatment.service';
import { reportKeys } from './query-keys';
import { REPORT_QUERY_WITH_PLACEHOLDER } from '../lib/report-query-options';

export function useReportSalesByTreatmentQuery(
  params: ReportSalesByTreatmentListParams,
  enabled = true,
) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: reportKeys.salesByTreatment(storeId ?? '', params),
    queryFn: () => listReportSalesByTreatment(storeId!, params),
    enabled: Boolean(storeId) && enabled,
    ...REPORT_QUERY_WITH_PLACEHOLDER,
  });
}
