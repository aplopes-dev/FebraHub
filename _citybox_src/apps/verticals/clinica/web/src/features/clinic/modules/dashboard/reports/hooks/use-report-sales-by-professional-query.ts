'use client';

import { useQuery } from '@tanstack/react-query';
import { useStore } from '@/lib/store-context';
import {
  listReportSalesByProfessional,
  type ReportSalesByProfessionalListParams,
} from '../services/reports-sales-by-professional.service';
import { reportKeys } from './query-keys';
import { REPORT_QUERY_WITH_PLACEHOLDER } from '../lib/report-query-options';

export function useReportSalesByProfessionalQuery(
  params: ReportSalesByProfessionalListParams,
  enabled = true,
) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: reportKeys.salesByProfessional(storeId ?? '', params),
    queryFn: () => listReportSalesByProfessional(storeId!, params),
    enabled: Boolean(storeId) && enabled,
    ...REPORT_QUERY_WITH_PLACEHOLDER,
  });
}
