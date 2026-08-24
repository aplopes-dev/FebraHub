import { endOfWeek, format, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import type { IReturnAlert } from '../components/header/return-alert/types';
import { RETURN_ALERT_WEEK_OPTIONS } from './return-alert-period';

export type ReturnAlertWeekGroup = {
  weekStart: Date;
  weekEnd: Date;
  alerts: IReturnAlert[];
};

export function groupReturnAlertsByWeek(alerts: IReturnAlert[]): ReturnAlertWeekGroup[] {
  const groups = new Map<string, ReturnAlertWeekGroup>();

  for (const alert of alerts) {
    const returnDate = new Date(alert.returnDate);
    const weekStart = startOfWeek(returnDate, RETURN_ALERT_WEEK_OPTIONS);
    const key = format(weekStart, 'yyyy-MM-dd');

    const existing = groups.get(key);
    if (existing) {
      existing.alerts.push(alert);
      continue;
    }

    groups.set(key, {
      weekStart,
      weekEnd: endOfWeek(returnDate, RETURN_ALERT_WEEK_OPTIONS),
      alerts: [alert],
    });
  }

  return Array.from(groups.values()).sort(
    (left, right) => left.weekStart.getTime() - right.weekStart.getTime(),
  );
}

export function formatReturnAlertWeekGroupLabel(group: ReturnAlertWeekGroup): string {
  const start = format(group.weekStart, 'dd/MM', { locale: ptBR });
  const end = format(group.weekEnd, 'dd/MM', { locale: ptBR });
  const count = group.alerts.length;
  const countLabel = count === 1 ? '1 retorno' : `${count} retornos`;
  return `Semana ${start} – ${end}: ${countLabel}`;
}
