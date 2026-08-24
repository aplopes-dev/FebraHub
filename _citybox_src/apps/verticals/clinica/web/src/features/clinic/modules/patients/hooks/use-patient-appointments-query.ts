'use client';

import { useMemo } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listAppointments } from '@/features/clinic/agenda/api/appointments';
import { useTeamMembers } from '@/features/clinic/agenda/api/team';
import { useStore } from '@/lib/store-context';
import { resolvePatientAppointmentProfessionalName } from '../lib/format-patient-appointment';
import {
  patientAppointmentKeys,
  type PatientAppointmentListParams,
} from './query-keys';

const DEFAULT_PARAMS: PatientAppointmentListParams = {
  page: 1,
  perPage: 5,
};

export function usePatientAppointmentsQuery(
  patientId: string | null,
  params: PatientAppointmentListParams = DEFAULT_PARAMS,
) {
  const { storeId } = useStore();
  const { data: teamData } = useTeamMembers();

  const query = useQuery({
    queryKey: patientAppointmentKeys.list(storeId ?? '', patientId ?? '', params),
    queryFn: () =>
      listAppointments(storeId!, {
        patientId: patientId!,
        page: params.page,
        perPage: params.perPage,
        sortBy: 'startAt',
        sortOrder: 'desc',
      }),
    enabled: Boolean(storeId) && Boolean(patientId),
    placeholderData: keepPreviousData,
  });

  const professionalNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const member of teamData?.professionals ?? []) {
      map.set(member.id, member.name);
    }
    return map;
  }, [teamData?.professionals]);

  const items = useMemo(() => {
    return (query.data?.items ?? []).map((item) => ({
      ...item,
      professionalDisplayName: resolvePatientAppointmentProfessionalName(
        item.professionalId,
        item.professional?.name,
        professionalNameById,
      ),
    }));
  }, [professionalNameById, query.data?.items]);

  return {
    ...query,
    items,
    meta: query.data?.meta ?? {
      total: 0,
      page: params.page,
      perPage: params.perPage,
      totalPages: 0,
    },
  };
}
