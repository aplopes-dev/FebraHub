'use client';

import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { SxProps, Theme } from '@mui/material/styles';
import { Box } from '@citybox/mui/atoms';
import { MiniCalendar } from '@/components/ui/mini-calendar';
import { Panel } from '@/components/ui/panel';
import { SCROLL_CLASS } from '@/lib/scroll';
import { useCurrentAgentId } from '@/features/shared/session/hooks/use-current-agent-id';
import {
  addMonths,
  parseMonthRef,
  todayIsoBahia,
  type MonthRef,
} from '@/features/shared/utils/calendar';
import {
  markedDaysFromAppointments,
  monthRangeIso,
} from '../services/calendar-service';
import {
  useAppointmentsQuery,
  useToggleAppointmentDoneMutation,
} from '../hooks/use-calendar-queries';
import { useDefaultScheduleFilter } from '../hooks/use-default-schedule-filter';
import { useWheelScrollChainToPage } from '../hooks/use-wheel-scroll-chain-to-page';
import type { CalendarAppointment, ScheduleListFilter } from '../types';
import {
  readStoredFilter,
  subscribeFilter,
  writeStoredFilter,
} from '../utils/list-filter-storage';
import { buildAppointmentListParams } from '../utils/appointment-list-params';
import { CalendarTaskList } from './calendar-task-list';
import { ScheduleFormDialog } from './schedule-form-dialog';

const EMPTY_APPOINTMENTS: CalendarAppointment[] = [];

function isoFromMonthDay(month: MonthRef, day: number): string {
  const m = String(month.month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${month.year}-${m}-${d}`;
}

function dayFromIso(iso: string): number {
  return Number(iso.slice(8, 10));
}

type DialogState =
  | { open: false }
  | { open: true; appointment: CalendarAppointment };

type CalendarMiniPanelProps = {
  /** Modo controlado — sincroniza com a grade principal da Agenda. */
  month?: MonthRef;
  selectedDate?: string;
  onMonthChange?: (direction: -1 | 1) => void;
  onSelectDay?: (day: number) => void;
  /** Modo standalone (dashboard) — data inicial quando não controlado. */
  initialDate?: string;
  /** Edição externa (Agenda); omitir para abrir modal interno (dashboard). */
  onEdit?: (appointment: CalendarAppointment) => void;
  className?: string;
  sx?: SxProps<Theme>;
  scrollable?: boolean;
};

export function CalendarMiniPanel({
  month: controlledMonth,
  selectedDate: controlledSelectedDate,
  onMonthChange,
  onSelectDay,
  initialDate,
  onEdit,
  className,
  sx,
  scrollable = false,
}: CalendarMiniPanelProps) {
  const agentId = useCurrentAgentId();
  const defaultFilter = useDefaultScheduleFilter();
  const listScrollRef = useRef<HTMLDivElement | null>(null);
  useWheelScrollChainToPage(listScrollRef, scrollable);
  const [defaultDate] = useState(() => initialDate ?? todayIsoBahia());
  const isControlled =
    controlledMonth != null && controlledSelectedDate != null;

  const [internalMonth, setInternalMonth] = useState<MonthRef>(() =>
    parseMonthRef(defaultDate),
  );
  const [internalSelectedDate, setInternalSelectedDate] =
    useState(defaultDate);
  const [dialog, setDialog] = useState<DialogState>({ open: false });

  const month = isControlled ? controlledMonth : internalMonth;
  const selectedDate = isControlled
    ? controlledSelectedDate
    : internalSelectedDate;

  const listFilter = useSyncExternalStore(
    subscribeFilter,
    () => readStoredFilter(defaultFilter),
    () => defaultFilter,
  );

  const monthQueryParams = useMemo(
    () => buildAppointmentListParams(monthRangeIso(month), agentId, listFilter),
    [month, agentId, listFilter],
  );
  const listReady = listFilter === 'all' || Boolean(agentId);
  const { data: monthResult } = useAppointmentsQuery(monthQueryParams, listReady);
  const monthAppointments = monthResult?.data ?? EMPTY_APPOINTMENTS;

  const dayQueryParams = useMemo(
    () =>
      buildAppointmentListParams(
        { from: selectedDate, to: selectedDate },
        agentId,
        listFilter,
      ),
    [selectedDate, agentId, listFilter],
  );

  const { data: dayResult } = useAppointmentsQuery(dayQueryParams, listReady);
  const dayAppointments = dayResult?.data ?? EMPTY_APPOINTMENTS;

  const markedDays = useMemo(
    () => markedDaysFromAppointments(monthAppointments, month),
    [monthAppointments, month],
  );

  const toggleDone = useToggleAppointmentDoneMutation();

  const handleSelectDay = useCallback(
    (day: number) => {
      if (onSelectDay) {
        onSelectDay(day);
        return;
      }
      setInternalSelectedDate(isoFromMonthDay(month, day));
    },
    [month, onSelectDay],
  );

  const handleMonthChange = useCallback(
    (direction: -1 | 1) => {
      if (onMonthChange) {
        onMonthChange(direction);
        return;
      }
      setInternalMonth((current) => {
        const next = addMonths(current, direction);
        setInternalSelectedDate(isoFromMonthDay(next, 1));
        return next;
      });
    },
    [onMonthChange],
  );

  const handleFilterChange = useCallback((filter: ScheduleListFilter) => {
    writeStoredFilter(filter);
  }, []);

  const handleToggleDone = useCallback(
    (appointment: CalendarAppointment) => {
      toggleDone.mutate(appointment);
    },
    [toggleDone],
  );

  const handleEdit = useCallback(
    (appointment: CalendarAppointment) => {
      if (onEdit) {
        onEdit(appointment);
        return;
      }
      setDialog({ open: true, appointment });
    },
    [onEdit],
  );

  const taskList = (
    <CalendarTaskList
      filter={listFilter}
      onFilterChange={handleFilterChange}
      appointments={dayAppointments}
      onToggleDone={handleToggleDone}
      onEdit={handleEdit}
    />
  );

  return (
    <>
      <Panel
        className={className}
        sx={[
          {
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            borderRadius: '20px',
            p: 2,
          },
          ...(scrollable
            ? [
                {
                  minHeight: 0,
                  minWidth: 0,
                  flex: 1,
                  overflow: 'hidden',
                } as const,
              ]
            : []),
          ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
        ]}
      >
        <MiniCalendar
          compact
          month={month}
          selectedDay={dayFromIso(selectedDate)}
          markedDays={markedDays}
          onMonthChange={handleMonthChange}
          onSelectDay={handleSelectDay}
        />
        {scrollable ? (
          <Box
            ref={listScrollRef}
            className={SCROLL_CLASS}
            sx={{
              minHeight: 0,
              flex: 1,
              overflowY: 'auto',
              overscrollBehavior: 'auto',
              pt: 0.5,
            }}
          >
            {taskList}
          </Box>
        ) : (
          <Box sx={{ pt: 0.5 }}>{taskList}</Box>
        )}
      </Panel>

      {!onEdit ? (
        <ScheduleFormDialog
          open={dialog.open}
          onOpenChange={(open) => {
            if (!open) setDialog({ open: false });
          }}
          mode="edit"
          initial={dialog.open ? dialog.appointment : null}
          defaultDate={selectedDate}
        />
      ) : null}
    </>
  );
}
