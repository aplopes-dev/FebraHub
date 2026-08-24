'use client';

import { useQuery } from '@tanstack/react-query';
import { useClinicId } from '@/features/clinic/estoque/lib/use-clinic-id';
import {
  listElectronicSignatures,
  type ListElectronicSignaturesParams,
} from '../services/electronic-signatures-report.api.service';
import { electronicSignaturesReportKeys } from './electronic-signatures-report-query-keys';

export function useElectronicSignaturesReportQuery(
  params: ListElectronicSignaturesParams,
  enabled = true,
) {
  const { clinicId, isReady } = useClinicId();
  const page = params.page ?? 1;
  const perPage = params.perPage ?? 20;

  return useQuery({
    queryKey: electronicSignaturesReportKeys.list(clinicId, {
      startDate: params.startDate,
      endDate: params.endDate,
      kind: params.kind,
      statuses: params.statuses,
      page,
      perPage,
    }),
    queryFn: () =>
      listElectronicSignatures(clinicId, {
        ...params,
        page,
        perPage,
      }),
    enabled: isReady && enabled,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}
