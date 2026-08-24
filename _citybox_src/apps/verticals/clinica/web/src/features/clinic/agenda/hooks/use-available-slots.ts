import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useStore } from '@/lib/store-context';
import { fetchAvailableSlots } from '@/features/clinic/agenda/api/available-slots';

export function useAvailableSlots(params: {
  professionalId: string | undefined;
  date: Date | undefined;
  durationMin: number;
}) {
  const { storeId } = useStore();
  const { professionalId, date, durationMin } = params;
  const dateStr = date ? format(date, 'yyyy-MM-dd') : null;

  return useQuery({
    queryKey: ['available-slots', storeId ?? '', professionalId, dateStr, durationMin],
    queryFn: () =>
      fetchAvailableSlots(storeId!, {
        professionalId: professionalId!,
        date: dateStr!,
        durationMin,
      }),
    enabled: Boolean(storeId) && Boolean(professionalId) && Boolean(date) && durationMin >= 5,
    staleTime: 30 * 1000,
  });
}
