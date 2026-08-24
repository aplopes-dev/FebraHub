import { WEEKDAY_IDS } from '../types/service-hours';
import type { WeekdayId } from '../types/service-hours';
import type { ServiceHoursConfig } from '../types/service-hours';

export const WEEKDAY_LABELS: Record<WeekdayId, string> = {
  mon: 'Seg',
  tue: 'Ter',
  wed: 'Qua',
  thu: 'Qui',
  fri: 'Sex',
  sat: 'Sáb',
  sun: 'Dom',
};

export const DEFAULT_SERVICE_HOURS: ServiceHoursConfig = {
  weekSchedule: {
    mon: { enabled: true, startTime: '08:00', endTime: '18:00' },
    tue: { enabled: true, startTime: '08:00', endTime: '18:00' },
    wed: { enabled: true, startTime: '08:00', endTime: '18:00' },
    thu: { enabled: true, startTime: '08:00', endTime: '18:00' },
    fri: { enabled: true, startTime: '08:00', endTime: '18:00' },
    sat: { enabled: false, startTime: '08:00', endTime: '18:00' },
    sun: { enabled: false, startTime: '08:00', endTime: '18:00' },
  },
  defaultConsultationMinutes: 30,
  fixedLunchBreak: {
    enabled: false,
    startTime: '12:00',
    endTime: '13:00',
  },
};

export function createDefaultServiceHours(): ServiceHoursConfig {
  return {
    weekSchedule: WEEKDAY_IDS.reduce<ServiceHoursConfig['weekSchedule']>((acc, weekdayId) => {
      acc[weekdayId] = { ...DEFAULT_SERVICE_HOURS.weekSchedule[weekdayId] };
      return acc;
    }, {} as ServiceHoursConfig['weekSchedule']),
    defaultConsultationMinutes: DEFAULT_SERVICE_HOURS.defaultConsultationMinutes,
    fixedLunchBreak: { ...DEFAULT_SERVICE_HOURS.fixedLunchBreak },
  };
}
