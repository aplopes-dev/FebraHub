'use client';

import { useQuery } from '@tanstack/react-query';
import { useStore } from '@/lib/store-context';
import {
  listReportOpenTreatmentsWithoutAppointment,
  type ReportOpenTreatmentsListParams,
} from '../services/reports-open-treatments.service';
import { reportKeys } from './query-keys';
import { REPORT_QUERY_WITH_PLACEHOLDER } from '../lib/report-query-options';

export function useReportOpenTreatmentsWithoutAppointmentQuery(
  params: ReportOpenTreatmentsListParams,
  enabled = true,
) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: reportKeys.openTreatmentsWithoutAppointment(
      storeId ?? '',
      params,
    ),
    queryFn: () =>
      listReportOpenTreatmentsWithoutAppointment(storeId!, params),
    enabled: Boolean(storeId) && enabled,
    ...REPORT_QUERY_WITH_PLACEHOLDER,
  });
}
