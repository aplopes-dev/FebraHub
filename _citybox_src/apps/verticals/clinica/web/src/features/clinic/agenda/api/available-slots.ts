import { clinicaFetch } from '@/features/clinic/shared/api';
import type { AvailableSlotsResponse } from './types';
import { buildQueryString } from './query';

type AvailableSlotsEnvelope = { data: AvailableSlotsResponse };

export async function fetchAvailableSlots(
  storeId: string,
  params: {
    professionalId: string;
    date: string;
    durationMin: number;
  },
): Promise<AvailableSlotsResponse> {
  const res = await clinicaFetch<AvailableSlotsEnvelope>(
    storeId,
    `/v1/available-slots${buildQueryString({
      professionalId: params.professionalId,
      date: params.date,
      durationMin: params.durationMin,
    })}`,
  );
  return res.data;
}
