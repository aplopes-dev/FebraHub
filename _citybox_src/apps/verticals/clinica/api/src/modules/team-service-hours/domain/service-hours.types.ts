export const WEEKDAY_IDS = [
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'sun',
] as const;

export type WeekdayId = (typeof WEEKDAY_IDS)[number];

export type WeekdaySchedule = {
  enabled: boolean;
  startTime: string;
  endTime: string;
};

export type FixedLunchBreak = {
  enabled: boolean;
  startTime: string;
  endTime: string;
};

export type ServiceHoursConfig = {
  weekSchedule: Record<WeekdayId, WeekdaySchedule>;
  defaultConsultationMinutes: number;
  fixedLunchBreak: FixedLunchBreak;
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
    weekSchedule: WEEKDAY_IDS.reduce<ServiceHoursConfig['weekSchedule']>(
      (acc, weekdayId) => {
        acc[weekdayId] = { ...DEFAULT_SERVICE_HOURS.weekSchedule[weekdayId] };
        return acc;
      },
      {} as ServiceHoursConfig['weekSchedule'],
    ),
    defaultConsultationMinutes:
      DEFAULT_SERVICE_HOURS.defaultConsultationMinutes,
    fixedLunchBreak: { ...DEFAULT_SERVICE_HOURS.fixedLunchBreak },
  };
}
