import {
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

import type { TCalendarView } from '../types';

/** Alinhado ao calendário da agenda (semana começa na segunda). */
export const RETURN_ALERT_WEEK_OPTIONS = { weekStartsOn: 1 as const };

export type ReturnAlertPeriodKind = 'week' | 'month';

export type ReturnAlertPeriod = {
  periodStart: Date;
  periodEnd: Date;
  periodKind: ReturnAlertPeriodKind;
  startDate: string;
  endDate: string;
};

/**
 * Define o intervalo de alertas de retorno conforme a visão do calendário.
 * Dia e semana usam a semana corrente (seg–dom) para antecipar retornos futuros na mesma semana.
 */
export function resolveReturnAlertPeriod(
  view: TCalendarView,
  selectedDate: Date,
): ReturnAlertPeriod {
  switch (view) {
    case 'day':
    case 'week': {
      const periodStart = startOfWeek(selectedDate, RETURN_ALERT_WEEK_OPTIONS);
      const periodEnd = endOfWeek(selectedDate, RETURN_ALERT_WEEK_OPTIONS);
      return {
        periodStart,
        periodEnd,
        periodKind: 'week',
        startDate: format(periodStart, 'yyyy-MM-dd'),
        endDate: format(periodEnd, 'yyyy-MM-dd'),
      };
    }
    case 'month':
    case 'agenda':
    case 'year': {
      const periodStart = startOfMonth(selectedDate);
      const periodEnd = endOfMonth(selectedDate);
      return {
        periodStart,
        periodEnd,
        periodKind: 'month',
        startDate: format(periodStart, 'yyyy-MM-dd'),
        endDate: format(periodEnd, 'yyyy-MM-dd'),
      };
    }
    default: {
      const periodStart = startOfWeek(selectedDate, RETURN_ALERT_WEEK_OPTIONS);
      const periodEnd = endOfWeek(selectedDate, RETURN_ALERT_WEEK_OPTIONS);
      return {
        periodStart,
        periodEnd,
        periodKind: 'week',
        startDate: format(periodStart, 'yyyy-MM-dd'),
        endDate: format(periodEnd, 'yyyy-MM-dd'),
      };
    }
  }
}

export function formatReturnAlertPeriodLabel(period: ReturnAlertPeriod): string {
  const startFormatted = format(period.periodStart, 'dd/MM', { locale: ptBR });
  const endFormatted = format(period.periodEnd, 'dd/MM', { locale: ptBR });

  if (period.periodKind === 'week') {
    if (startFormatted === endFormatted) {
      return `para a semana de ${startFormatted}`;
    }
    return `para a semana de ${startFormatted} a ${endFormatted}`;
  }

  const monthLabel = format(period.periodStart, "MMMM 'de' yyyy", { locale: ptBR });
  return `para ${monthLabel}`;
}
