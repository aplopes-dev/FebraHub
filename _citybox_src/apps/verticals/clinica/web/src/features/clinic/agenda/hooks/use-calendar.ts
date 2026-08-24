import { useQuery } from '@tanstack/react-query';
import { useStore } from '@/lib/store-context';
import { getCalendar, type GetCalendarParams } from '@/features/clinic/agenda/api/calendar';
import type { CalendarResponse } from '@/features/clinic/agenda/api/types';

export const calendarQueryKeys = {
  all: ['schedule', 'calendar'] as const,
  byParams: (storeId: string, params: GetCalendarParams) =>
    [...calendarQueryKeys.all, storeId, params] as const,
};

export function useCalendarApi(params: GetCalendarParams) {
  const { storeId } = useStore();

  return useQuery<CalendarResponse>({
    queryKey: calendarQueryKeys.byParams(storeId ?? '', params),
    queryFn: () => getCalendar(storeId!, params),
    enabled: Boolean(storeId) && Boolean(params.startDate) && Boolean(params.endDate),
    staleTime: 10 * 1000,
    // Confirmações chegam por WhatsApp sem interação na tela.
    refetchInterval: 15 * 1000,
  });
}
