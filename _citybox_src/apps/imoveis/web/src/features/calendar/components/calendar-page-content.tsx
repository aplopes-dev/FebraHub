'use client';

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useSearchParams } from 'next/navigation';
import AddIcon from '@mui/icons-material/Add';
import IosShareIcon from '@mui/icons-material/IosShare';
import { Box, Button, Stack, Typography } from '@citybox/mui/atoms';
import { toast } from '@citybox/mui/molecules';
import { useCurrentAgentId } from '@/features/shared/session/hooks/use-current-agent-id';
import {
  addMonths,
  getMonthGridCells,
  parseMonthRef,
  todayIsoBahia,
  type MonthRef,
} from '@/features/shared/utils/calendar';
import { addDaysIso, getWeekStart } from '../services/calendar-service';
import { useDefaultScheduleFilter } from '../hooks/use-default-schedule-filter';
import { useAppointmentsQuery } from '../hooks/use-calendar-queries';
import { buildAppointmentListParams } from '../utils/appointment-list-params';
import {
  readStoredFilter,
  subscribeFilter,
} from '../utils/list-filter-storage';
import { type CalendarAppointment, type CalendarViewMode } from '../types';
import { downloadCsv } from '@/features/shared/utils/download-csv';
import { listifyElevatedSurface } from '@/theme/listify-field-styles';
import { CalendarGoogleBanner } from './calendar-google-banner';
import { CalendarRemindersCard } from './calendar-reminders-card';
import { CalendarViewToggle } from './calendar-view-toggle';
import {
  CalendarAppointmentsSheet,
  type CalendarAppointmentsSheetState,
} from './calendar-appointments-sheet';
import {
  appointmentsInSlot,
  appointmentsOnDay,
} from './calendar-day-layout';
import { CalendarMiniPanel } from './calendar-mini-panel';
import { DayCalendarGrid } from './day-calendar-grid';
import { MonthCalendarGrid } from './month-calendar-grid';
import { ScheduleFormDialog } from './schedule-form-dialog';
import { WeeklyCalendarGrid } from './weekly-calendar-grid';

const VIEW_STORAGE_KEY = 'imoveis.calendar.view';
const VIEW_CHANGE_EVENT = 'imoveis-calendar-view-changed';
const EMPTY_APPOINTMENTS: CalendarAppointment[] = [];

/**
 * Viewport mínimo para lateral (notificações + mini).
 * Acima: side | agenda. Abaixo: cards sob a agenda lado a lado.
 * Valor alto o suficiente para os cards descerem cedo ao encolher (antes de apertar a grade).
 */
const CALENDAR_SIDE_LAYOUT_MIN = 1400;

const sideLayoutUp = `@media (min-width:${CALENDAR_SIDE_LAYOUT_MIN}px)`;

const actionButtonSx = {
  borderRadius: { xs: '10px', sm: '20px' },
  px: 3,
  py: 1.75,
  fontSize: { xs: '0.875rem', sm: '1rem' },
  fontWeight: 500,
  textTransform: 'none',
} as const;

function readStoredView(): CalendarViewMode {
  if (typeof window === 'undefined') return 'week';
  try {
    const value = window.localStorage.getItem(VIEW_STORAGE_KEY);
    if (value === 'day' || value === 'week' || value === 'month') return value;
    // Smartphone: Dia é mais legível que a grade semanal densa.
    if (window.matchMedia('(max-width: 767px)').matches) return 'day';
    return 'week';
  } catch {
    return 'week';
  }
}

function subscribeView(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => onStoreChange();
  window.addEventListener(VIEW_CHANGE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(VIEW_CHANGE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

function writeStoredView(view: CalendarViewMode): void {
  try {
    window.localStorage.setItem(VIEW_STORAGE_KEY, view);
    window.dispatchEvent(new Event(VIEW_CHANGE_EVENT));
  } catch {
    // ignore
  }
}

function isoFromMonthDay(month: MonthRef, day: number): string {
  const m = String(month.month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${month.year}-${m}-${d}`;
}

type DialogState =
  | { open: false }
  | {
      open: true;
      mode: 'create' | 'edit';
      appointment?: CalendarAppointment | null;
      defaultDate?: string;
      defaultStartHour?: number;
    };

export function CalendarPageContent() {
  const searchParams = useSearchParams();
  const agentId = useCurrentAgentId();
  const defaultFilter = useDefaultScheduleFilter();
  const listFilter = useSyncExternalStore(
    subscribeFilter,
    () => readStoredFilter(defaultFilter),
    () => defaultFilter,
  );
  const deepLinkDate = searchParams.get('date');
  const deepLinkAppointmentId = searchParams.get('appointmentId');

  const [today] = useState(todayIsoBahia);
  const initialDate =
    deepLinkDate && /^\d{4}-\d{2}-\d{2}$/.test(deepLinkDate)
      ? deepLinkDate
      : today;
  const [month, setMonth] = useState<MonthRef>(() => parseMonthRef(initialDate));
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [weekStart, setWeekStart] = useState(() => getWeekStart(initialDate));
  const [dialog, setDialog] = useState<DialogState>({ open: false });
  const [sheet, setSheet] = useState<CalendarAppointmentsSheetState>({
    open: false,
  });
  const [appliedDeepLink, setAppliedDeepLink] = useState<string | null>(null);

  const viewMode = useSyncExternalStore(
    subscribeView,
    readStoredView,
    () => 'week' as CalendarViewMode,
  );

  const listRange = useMemo(() => {
    if (viewMode === 'day') {
      return { from: selectedDate, to: selectedDate };
    }
    if (viewMode === 'week') {
      return { from: weekStart, to: addDaysIso(weekStart, 6) };
    }
    const cells = getMonthGridCells(month);
    const start = cells[0]?.date ?? selectedDate;
    const end = cells[cells.length - 1]?.date ?? selectedDate;
    return { from: start, to: end };
  }, [viewMode, selectedDate, weekStart, month]);

  const listQueryParams = useMemo(
    () => buildAppointmentListParams(listRange, agentId, listFilter),
    [listRange, agentId, listFilter],
  );

  // Evita GET com mock `ana-helena` enquanto members/me ainda não resolveu o agentId real.
  const listReady = listFilter === 'all' || Boolean(agentId);
  const { data: listResult } = useAppointmentsQuery(listQueryParams, listReady);
  const allAppointments = listResult?.data ?? EMPTY_APPOINTMENTS;

  useEffect(() => {
    if (!deepLinkAppointmentId && !deepLinkDate) return;
    const key = `${deepLinkDate ?? ''}:${deepLinkAppointmentId ?? ''}`;
    if (appliedDeepLink === key) return;

    if (deepLinkDate && /^\d{4}-\d{2}-\d{2}$/.test(deepLinkDate)) {
      setSelectedDate(deepLinkDate);
      setWeekStart(getWeekStart(deepLinkDate));
      setMonth(parseMonthRef(deepLinkDate));
    }

    if (deepLinkAppointmentId) {
      const found = allAppointments.find(
        (item) => item.id === deepLinkAppointmentId,
      );
      if (found) {
        setDialog({
          open: true,
          mode: 'edit',
          appointment: found,
        });
        setAppliedDeepLink(key);
        return;
      }
      // Ainda carregando a lista do intervalo — espera a próxima render.
      if (listResult === undefined) return;
    }

    setAppliedDeepLink(key);
  }, [
    deepLinkAppointmentId,
    deepLinkDate,
    allAppointments,
    listResult,
    appliedDeepLink,
  ]);

  const selectedDayAppointments = useMemo(
    () => appointmentsOnDay(allAppointments, selectedDate),
    [allAppointments, selectedDate],
  );

  const weekAppointments = useMemo(() => {
    const end = addDaysIso(weekStart, 6);
    return allAppointments.filter(
      (item) => item.date >= weekStart && item.date <= end,
    );
  }, [allAppointments, weekStart]);

  const monthAppointments = useMemo(() => {
    const cells = getMonthGridCells(month);
    const start = cells[0]?.date;
    const end = cells[cells.length - 1]?.date;
    if (!start || !end) return [];
    return allAppointments.filter(
      (item) => item.date >= start && item.date <= end,
    );
  }, [allAppointments, month]);

  const sheetAppointments = useMemo(() => {
    if (!sheet.open) return [];
    if (sheet.slotHour != null) {
      return appointmentsInSlot(allAppointments, sheet.date, sheet.slotHour);
    }
    return appointmentsOnDay(allAppointments, sheet.date);
  }, [allAppointments, sheet]);

  const handleSelectDay = useCallback(
    (day: number) => {
      const iso = isoFromMonthDay(month, day);
      setSelectedDate(iso);
      setWeekStart(getWeekStart(iso));
    },
    [month],
  );

  const handleMonthChange = useCallback((direction: -1 | 1) => {
    setMonth((current) => {
      const next = addMonths(current, direction);
      const iso = isoFromMonthDay(next, 1);
      setSelectedDate(iso);
      setWeekStart(getWeekStart(iso));
      return next;
    });
  }, []);

  const handleWeekChange = useCallback((direction: -1 | 1) => {
    setWeekStart((current) => {
      const next = addDaysIso(current, direction * 7);
      setSelectedDate(next);
      setMonth(parseMonthRef(next));
      return next;
    });
  }, []);

  const handleDayChange = useCallback((direction: -1 | 1) => {
    setSelectedDate((current) => {
      const next = addDaysIso(current, direction);
      setWeekStart(getWeekStart(next));
      setMonth(parseMonthRef(next));
      return next;
    });
  }, []);

  const handleViewChange = useCallback((view: CalendarViewMode) => {
    writeStoredView(view);
  }, []);

  function handleExport() {
    if (allAppointments.length === 0) {
      toast.message('Nada para exportar', {
        description: 'Não há compromissos no intervalo visível.',
      });
      return;
    }

    downloadCsv(
      `agenda-${listRange.from}-${listRange.to}.csv`,
      [
        'Data',
        'Início',
        'Fim',
        'Título',
        'Tipo',
        'Local',
        'Lead',
        'Concluído',
      ],
      allAppointments.map((item: CalendarAppointment) => [
        item.date,
        item.startTime,
        item.endTime,
        item.title,
        item.kind,
        item.location,
        item.leadName ?? '',
        item.done ? 'Sim' : 'Não',
      ]),
    );
    toast.success('CSV exportado');
  }

  function openSlotSheet(date: string, hour: number) {
    setSelectedDate(date);
    setWeekStart(getWeekStart(date));
    setMonth(parseMonthRef(date));
    setSheet({ open: true, date, slotHour: hour });
  }

  function openDaySheet(date: string) {
    setSelectedDate(date);
    setWeekStart(getWeekStart(date));
    setMonth(parseMonthRef(date));
    setSheet({ open: true, date });
  }

  function openCreate(date?: string, hour?: number) {
    setDialog({
      open: true,
      mode: 'create',
      defaultDate: date ?? selectedDate,
      defaultStartHour: hour,
    });
  }

  function openEdit(appointment: CalendarAppointment) {
    setDialog({ open: true, mode: 'edit', appointment });
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        width: '100%',
        minWidth: 0,
        gap: { xs: 2, sm: 2.5 },
        pb: { xs: 1, sm: 2 },
        [sideLayoutUp]: {
          flexDirection: 'row',
        },
      }}
    >
      {/* Grade principal — topo no mobile; à direita com lateral. */}
      <Stack
        spacing={{ xs: 1.5, sm: 2 }}
        sx={{
          order: 1,
          flex: 'none',
          minWidth: 0,
          width: '100%',
          [sideLayoutUp]: {
            order: 2,
            flex: '1 1 0%',
          },
        }}
      >
        <CalendarGoogleBanner />

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 1.25, sm: 1.5 }}
          sx={{
            flexShrink: 0,
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: 'space-between',
            gap: { xs: 1.25, sm: 1.5 },
            px: { xs: 0, sm: 0.5 },
            minWidth: 0,
          }}
        >
          <Stack
            spacing={1}
            sx={{ minWidth: 0, width: { xs: '100%', sm: 'auto' } }}
          >
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: '1.375rem', sm: '1.75rem' },
                fontWeight: 500,
                letterSpacing: '-0.02em',
                lineHeight: 1.3,
              }}
            >
              Agenda
            </Typography>
            <CalendarViewToggle value={viewMode} onChange={handleViewChange} />
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              minWidth: 0,
              '& > *': { flex: { xs: '1 1 0', sm: '0 0 auto' } },
            }}
          >
            <Button
              type="button"
              variant="contained"
              color="inherit"
              onClick={handleExport}
              startIcon={<IosShareIcon sx={{ fontSize: 18 }} />}
              sx={{
                ...actionButtonSx,
                bgcolor: (theme) => listifyElevatedSurface(theme),
                color: 'text.primary',
                boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
                '&:hover': { bgcolor: 'secondary.light' },
                px: { xs: 1.5, sm: 3 },
                py: { xs: 1.25, sm: 1.75 },
              }}
            >
              Exportar
            </Button>
            <Button
              type="button"
              variant="contained"
              startIcon={<AddIcon sx={{ fontSize: 18 }} />}
              onClick={() => openCreate()}
              sx={{
                ...actionButtonSx,
                boxShadow: 'none',
                px: { xs: 1.5, sm: 3 },
                py: { xs: 1.25, sm: 1.75 },
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                Adicionar compromisso
              </Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                Novo
              </Box>
            </Button>
          </Stack>
        </Stack>

        <Box sx={{ minWidth: 0, width: '100%' }}>
          {viewMode === 'day' ? (
            <DayCalendarGrid
              date={selectedDate}
              appointments={selectedDayAppointments}
              onDayChange={handleDayChange}
              onOpenSlotSheet={openSlotSheet}
              onEditAppointment={openEdit}
            />
          ) : null}

          {viewMode === 'week' ? (
            <WeeklyCalendarGrid
              weekStart={weekStart}
              selectedDate={selectedDate}
              appointments={weekAppointments}
              onWeekChange={handleWeekChange}
              onOpenSlotSheet={openSlotSheet}
              onEditAppointment={openEdit}
            />
          ) : null}

          {viewMode === 'month' ? (
            <MonthCalendarGrid
              month={month}
              selectedDate={selectedDate}
              appointments={monthAppointments}
              onMonthChange={handleMonthChange}
              onOpenDaySheet={openDaySheet}
              onEditAppointment={openEdit}
            />
          ) : null}
        </Box>
      </Stack>

      {/*
        ≥ 1400px: coluna fixa à esquerda (cards empilhados).
        < 1400px: sob a agenda, dois cards iguais lado a lado.
      */}
      <Box
        sx={{
          order: 2,
          flex: 'none',
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          display: 'grid',
          gap: { xs: 1.5, sm: 2 },
          alignItems: 'stretch',
          // Mobile: empilha (evita cards esmagados lado a lado).
          // Tablet+: dois cards; desktop largo: coluna lateral única.
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'minmax(0, 1fr) minmax(0, 1fr)',
          },
          [sideLayoutUp]: {
            order: 1,
            flex: '0 0 280px',
            width: 280,
            gridTemplateColumns: '1fr',
            alignItems: 'start',
          },
        }}
      >
        <Box
          sx={{
            minWidth: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            '& > .MuiPaper-root, & > section': {
              flex: 1,
              height: '100%',
              minHeight: 0,
            },
          }}
        >
          <CalendarRemindersCard />
        </Box>

        <Box
          sx={{
            minWidth: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            '& > .MuiPaper-root, & > section': {
              flex: 1,
              height: '100%',
              minHeight: 0,
            },
          }}
        >
          <CalendarMiniPanel
            month={month}
            selectedDate={selectedDate}
            onMonthChange={handleMonthChange}
            onSelectDay={(day) => handleSelectDay(day)}
            onEdit={openEdit}
            sx={{
              minWidth: 0,
              width: '100%',
              height: '100%',
              flex: 1,
              borderRadius: { xs: '14px', sm: '20px' },
              p: { xs: 1.5, sm: 2 },
            }}
          />
        </Box>
      </Box>

      <ScheduleFormDialog
        open={dialog.open}
        onOpenChange={(open) => {
          if (!open) setDialog({ open: false });
        }}
        mode={dialog.open ? dialog.mode : 'create'}
        initial={dialog.open ? dialog.appointment : null}
        defaultDate={dialog.open ? dialog.defaultDate : selectedDate}
        defaultStartHour={dialog.open ? dialog.defaultStartHour : undefined}
      />

      <CalendarAppointmentsSheet
        state={sheet}
        appointments={sheetAppointments}
        onOpenChange={(open) => {
          if (!open) setSheet({ open: false });
        }}
        onEdit={openEdit}
        onAdd={openCreate}
      />
    </Box>
  );
}
