'use client';

import { useQuery } from '@tanstack/react-query';
import { useStore } from '@/lib/store-context';
import {
  listReportReferredPatients,
  type ReportReferredPatientsListParams,
} from '../services/reports-referred-patients.service';
import { reportKeys } from './query-keys';
import { REPORT_QUERY_WITH_PLACEHOLDER } from '../lib/report-query-options';

export function useReportReferredPatientsQuery(
  params: ReportReferredPatientsListParams,
  enabled = true,
) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: reportKeys.referredPatients(storeId ?? '', params),
    queryFn: () => listReportReferredPatients(storeId!, params),
    enabled: Boolean(storeId) && enabled,
    ...REPORT_QUERY_WITH_PLACEHOLDER,
  });
}
