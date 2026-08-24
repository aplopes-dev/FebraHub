'use client';

import { clinicaFetch } from '@/features/clinic/shared/api/clinica-client';
import type { ServiceHoursConfig } from '../types/service-hours';

type ServiceHoursEnvelope = { data: ServiceHoursConfig };

export async function getServiceHours(
  storeId: string,
  memberId: string,
): Promise<ServiceHoursConfig> {
  const res = await clinicaFetch<ServiceHoursEnvelope>(
    storeId,
    `/v1/team/${memberId}/service-hours`,
  );
  return res.data;
}

export async function saveServiceHours(
  storeId: string,
  memberId: string,
  config: ServiceHoursConfig,
): Promise<ServiceHoursConfig> {
  const res = await clinicaFetch<ServiceHoursEnvelope>(
    storeId,
    `/v1/team/${memberId}/service-hours`,
    {
      method: 'PUT',
      body: JSON.stringify(config),
    },
  );
  return res.data;
}
