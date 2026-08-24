export const WEEKDAY_IDS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

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

export type WeekdaySchedulePatch = Partial<WeekdaySchedule>;

export type FixedLunchBreakPatch = Partial<FixedLunchBreak>;
