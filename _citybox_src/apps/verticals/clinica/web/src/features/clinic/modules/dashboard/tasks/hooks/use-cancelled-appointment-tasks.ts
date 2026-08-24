'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useStore } from '@/lib/store-context';
import { useTeamMembers } from '@/features/clinic/agenda/api/team';
import type { CommissionPeriodFilter } from '@/features/clinic/financeiro/comissoes/types/commission-financial.types';
import { resolveCommissionPeriodDates } from '@/features/clinic/financeiro/comissoes/lib/filter-commissions-by-period';
import { filterIgnoredCancelledAppointmentTasks } from '../lib/filter-cancelled-appointment-tasks';
import {
  addIgnoredCancelledTaskId,
  readIgnoredCancelledTaskIds,
} from '../lib/ignored-cancelled-tasks-storage';
import { listCancelledAppointmentTasks } from '../services/cancelled-appointment-tasks.service';
import type { CancelledAppointmentTask } from '../types/cancelled-appointment-task';
import { cancelledAppointmentTaskKeys } from './query-keys';
import { DASHBOARD_QUERY_FRESHNESS } from '../../lib/dashboard-query-options';

export function useCancelledAppointmentTasks() {
  const { storeId } = useStore();
  const { data: teamData } = useTeamMembers();
  const [period, setPeriod] = useState<CommissionPeriodFilter>('this_week');
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();
  const [ignoredIds, setIgnoredIds] = useState<Set<string>>(() => new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!storeId) {
      setIgnoredIds(new Set());
      setHydrated(true);
      return;
    }
    setIgnoredIds(readIgnoredCancelledTaskIds(storeId));
    setHydrated(true);
  }, [storeId]);

  const periodRange = useMemo(
    () => resolveCommissionPeriodDates(period, customStart, customEnd),
    [period, customStart, customEnd],
  );

  const listParams = useMemo(
    () => ({
      startDate: periodRange.startDate,
      endDate: periodRange.endDate,
      page: 1,
      perPage: 100,
    }),
    [periodRange.endDate, periodRange.startDate],
  );

  const query = useQuery({
    queryKey: cancelledAppointmentTaskKeys.list(storeId ?? '', listParams),
    queryFn: () => listCancelledAppointmentTasks(storeId!, listParams),
    enabled: Boolean(storeId) && hydrated,
    ...DASHBOARD_QUERY_FRESHNESS,
  });

  const professionalNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const member of teamData?.professionals ?? []) {
      map.set(member.id, member.name);
      if (member.userId) map.set(member.userId, member.name);
    }
    return map;
  }, [teamData?.professionals]);

  const tasks = useMemo((): CancelledAppointmentTask[] => {
    const items = (query.data?.items ?? []).map((item) => ({
      id: item.id,
      patientId: item.patientId,
      patientName: item.patientName,
      patientPhone: item.patientPhone,
      professionalId: item.professionalId,
      professionalName:
        professionalNameById.get(item.professionalId) ?? '—',
      appointmentAt: item.appointmentAt,
      durationMin: item.durationMin,
      categoryId: item.categoryId,
      observations: item.observations,
      status: item.status,
    }));
    return filterIgnoredCancelledAppointmentTasks(items, ignoredIds);
  }, [ignoredIds, professionalNameById, query.data?.items]);

  const ignoreTask = useCallback(
    (taskId: string) => {
      if (!storeId) {
        setIgnoredIds((prev) => new Set([...prev, taskId]));
        return;
      }
      setIgnoredIds(addIgnoredCancelledTaskId(storeId, taskId));
    },
    [storeId],
  );

  const resolveTask = useCallback(
    (taskId: string) => {
      ignoreTask(taskId);
    },
    [ignoreTask],
  );

  return {
    period,
    setPeriod,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    periodRange,
    tasks,
    hydrated,
    isLoading: !hydrated || query.isLoading,
    isError: query.isError,
    ignoreTask,
    resolveTask,
  };
}

export type { CancelledAppointmentTask };
