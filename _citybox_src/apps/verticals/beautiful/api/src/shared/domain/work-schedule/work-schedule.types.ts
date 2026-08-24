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

export function createEmptyWeekSchedule(): WeekSchedule {
  return WEEKDAY_IDS.reduce<WeekSchedule>((acc, weekday) => {
    acc[weekday] = [];
    return acc;
  }, {} as WeekSchedule);
}

export function createDefaultWeekSchedule(): WeekSchedule {
  const week = createEmptyWeekSchedule();
  for (const day of ['mon', 'tue', 'wed', 'thu', 'fri'] as WeekdayId[]) {
    week[day] = [{ startTime: '09:00', endTime: '18:00' }];
  }
  return week;
}

export type WorkIntervalRow = {
  weekday: WeekdayId;
  startTime: string;
  endTime: string;
  sortOrder: number;
};

export function flattenWeekSchedule(week: WeekSchedule): WorkIntervalRow[] {
  const rows: WorkIntervalRow[] = [];
  for (const weekday of WEEKDAY_IDS) {
    week[weekday].forEach((interval, index) => {
      rows.push({
        weekday,
        startTime: interval.startTime,
        endTime: interval.endTime,
        sortOrder: index,
      });
    });
  }
  return rows;
}

export function buildWeekScheduleFromRows(
  rows: WorkIntervalRow[],
): WeekSchedule {
  const week = createEmptyWeekSchedule();
  const sorted = [...rows].sort((a, b) => {
    if (a.weekday !== b.weekday) {
      return WEEKDAY_IDS.indexOf(a.weekday) - WEEKDAY_IDS.indexOf(b.weekday);
    }
    return a.sortOrder - b.sortOrder;
  });
  for (const row of sorted) {
    week[row.weekday].push({
      startTime: row.startTime,
      endTime: row.endTime,
    });
  }
  return week;
}
