'use client';

import { useQuery } from '@tanstack/react-query';
import { useStore } from '@/lib/store-context';
import {
  listReportSalesBySpecialty,
  type ReportSalesBySpecialtyListParams,
} from '../services/reports-sales-by-specialty.service';
import { reportKeys } from './query-keys';
import { REPORT_QUERY_WITH_PLACEHOLDER } from '../lib/report-query-options';

export function useReportSalesBySpecialtyQuery(
  params: ReportSalesBySpecialtyListParams,
  enabled = true,
) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: reportKeys.salesBySpecialty(storeId ?? '', params),
    queryFn: () => listReportSalesBySpecialty(storeId!, params),
    enabled: Boolean(storeId) && enabled,
    ...REPORT_QUERY_WITH_PLACEHOLDER,
  });
}
