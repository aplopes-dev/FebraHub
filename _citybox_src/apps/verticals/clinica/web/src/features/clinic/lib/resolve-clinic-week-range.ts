import { addDays, startOfWeek } from 'date-fns';
import { formatLocalDateString } from '@/features/clinic/agenda/lib/local-date';

export type ClinicWeekRange = {
  startDate: string;
  endDate: string;
};

/** Segunda a sábado — domingo excluído (clínica geralmente fechada). */
export function resolveClinicWeekRange(
  referenceDate: Date = new Date(),
): ClinicWeekRange {
  const today = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );
  const monday = startOfWeek(today, { weekStartsOn: 1 });
  const saturday = addDays(monday, 5);
  return {
    startDate: formatLocalDateString(monday),
    endDate: formatLocalDateString(saturday),
  };
}
