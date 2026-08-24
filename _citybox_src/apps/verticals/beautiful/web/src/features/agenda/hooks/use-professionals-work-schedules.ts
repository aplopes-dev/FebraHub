'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as memberService from '@/features/members/services/member-service';
import { MEMBER_WORK_SCHEDULE_QUERY_KEY } from '@/features/members/hooks/use-members-queries';
import type { WeekSchedule, WorkInterval } from '@/lib/work-schedule';
import { createEmptyWeekSchedule } from '@/lib/work-schedule';
import {
  isHourWithinWorkIntervals,
  weekdayIdFromIsoDate,
} from '../utils/agenda-work-slot';

export const MEMBERS_WORK_SCHEDULES_LIST_QUERY_KEY = [
  ...MEMBER_WORK_SCHEDULE_QUERY_KEY,
  'list',
] as const;

/** @deprecated Prefer MEMBERS_WORK_SCHEDULES_LIST_QUERY_KEY */
export const PROFESSIONALS_WORK_SCHEDULES_LIST_QUERY_KEY =
  MEMBERS_WORK_SCHEDULES_LIST_QUERY_KEY;

/**
 * Grades semanais dos membros agendáveis.
 * `professionalIds` = member ids (appointment API ainda usa professionalId = member.id).
 */
export function useProfessionalsWorkSchedulesQuery(professionalIds: string[]) {
  const sortedIds = useMemo(
    () => [...professionalIds].sort(),
    [professionalIds],
  );

  const { data = [], isPending } = useQuery({
    queryKey: [...MEMBERS_WORK_SCHEDULES_LIST_QUERY_KEY, sortedIds],
    queryFn: () =>
      memberService.listMemberWorkSchedules({
        memberIds: sortedIds,
      }),
    enabled: sortedIds.length > 0,
  });

  const schedulesByProfessionalId = useMemo(() => {
    const map = new Map<string, WeekSchedule>();
    for (const id of professionalIds) {
      map.set(id, createEmptyWeekSchedule());
    }
    for (const item of data) {
      map.set(item.memberId, item.week);
    }
    return map;
  }, [data, professionalIds]);

  return {
    schedulesByProfessionalId,
    isLoading: sortedIds.length > 0 && isPending,
  };
}

export function getDayIntervalsForProfessional(
  schedulesByProfessionalId: Map<string, WeekSchedule>,
  professionalId: string,
  date: string,
): WorkInterval[] {
  const week =
    schedulesByProfessionalId.get(professionalId) ?? createEmptyWeekSchedule();
  return week[weekdayIdFromIsoDate(date)] ?? [];
}

export function isWorkingHourSlot(
  schedulesByProfessionalId: Map<string, WeekSchedule>,
  professionalId: string,
  date: string,
  hour: number,
  scheduleLoaded: boolean,
): boolean {
  if (!scheduleLoaded) return false;
  const intervals = getDayIntervalsForProfessional(
    schedulesByProfessionalId,
    professionalId,
    date,
  );
  return isHourWithinWorkIntervals(hour, intervals);
}
