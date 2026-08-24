import { clinicaFetch } from '@/features/clinic/shared/api';
import type { CalendarResponse } from './types';
import { buildQueryString, joinIds } from './query';

export interface GetCalendarParams {
  startDate: string;
  endDate: string;
  professionalIds?: string[];
}

export async function getCalendar(
  storeId: string,
  params: GetCalendarParams,
): Promise<CalendarResponse> {
  return clinicaFetch<CalendarResponse>(
    storeId,
    `/v1/appointments/calendar${buildQueryString({
      startDate: params.startDate,
      endDate: params.endDate,
      professionalIds: joinIds(params.professionalIds),
    })}`,
  );
}

/** @deprecated Use `getCalendar` — mantido para compatibilidade com hooks legados. */
export const calendarApi = {
  get: getCalendar,
};
