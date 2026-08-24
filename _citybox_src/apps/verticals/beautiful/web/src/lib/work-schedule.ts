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

export type WorkInterval = {
  startTime: string;
  endTime: string;
};

export type WeekSchedule = Record<WeekdayId, WorkInterval[]>;

export const WEEKDAY_LABELS: Record<WeekdayId, string> = {
  mon: 'Segunda',
  tue: 'Terça',
  wed: 'Quarta',
  thu: 'Quinta',
  fri: 'Sexta',
  sat: 'Sábado',
  sun: 'Domingo',
};

export function createEmptyWeekSchedule(): WeekSchedule {
  return {
    mon: [],
    tue: [],
    wed: [],
    thu: [],
    fri: [],
    sat: [],
    sun: [],
  };
}

export function createDefaultWeekSchedule(): WeekSchedule {
  const workday: WorkInterval[] = [
    { startTime: '08:00', endTime: '12:00' },
    { startTime: '13:00', endTime: '18:00' },
  ];
  return {
    mon: workday.map((interval) => ({ ...interval })),
    tue: workday.map((interval) => ({ ...interval })),
    wed: workday.map((interval) => ({ ...interval })),
    thu: workday.map((interval) => ({ ...interval })),
    fri: workday.map((interval) => ({ ...interval })),
    sat: [],
    sun: [],
  };
}

export function isWeekScheduleEmpty(week: WeekSchedule): boolean {
  return WEEKDAY_IDS.every((day) => week[day].length === 0);
}
