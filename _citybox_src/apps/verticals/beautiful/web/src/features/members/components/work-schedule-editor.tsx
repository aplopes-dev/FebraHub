'use client';

import { useId, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Divider,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@citybox/mui/atoms';
import { TimePicker } from '@citybox/mui/molecules';
import { Icon } from '@citybox/mui/icons';
import {
  WEEKDAY_IDS,
  WEEKDAY_LABELS,
  createDefaultWeekSchedule,
  createEmptyWeekSchedule,
  type WeekdayId,
  type WeekSchedule,
  type WorkInterval,
} from '@/lib/work-schedule';

export const MAX_INTERVALS_PER_DAY = 3;

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Altura fixa de cada linha de intervalo (TimePicker small + ações). */
const INTERVAL_SLOT_HEIGHT = 48;
/** Reserva visual para alerta de validação (evita reflow). */
const ALERT_SLOT_HEIGHT = 56;
const TABS_HEIGHT = 40;
const DAY_HEADER_HEIGHT = 40;
const DAY_ACTION_HEIGHT = 36;
const DAY_BODY_PADDING_Y = 16; // py: 1 → 8+8
const DAY_HEADER_GAP = 8; // mb after header + divider
const INTERVALS_AREA_HEIGHT = MAX_INTERVALS_PER_DAY * INTERVAL_SLOT_HEIGHT;

const DAY_PANEL_HEIGHT =
  TABS_HEIGHT +
  DAY_BODY_PADDING_Y +
  DAY_HEADER_HEIGHT +
  DAY_HEADER_GAP +
  INTERVALS_AREA_HEIGHT +
  DAY_ACTION_HEIGHT;

const WEEKDAY_SHORT: Record<WeekdayId, string> = {
  mon: 'Seg',
  tue: 'Ter',
  wed: 'Qua',
  thu: 'Qui',
  fri: 'Sex',
  sat: 'Sáb',
  sun: 'Dom',
};

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function validateWeekSchedule(week: WeekSchedule): string | null {
  for (const day of WEEKDAY_IDS) {
    const intervals = week[day];
    if (intervals.length > MAX_INTERVALS_PER_DAY) {
      return `${WEEKDAY_LABELS[day]}: no máximo ${MAX_INTERVALS_PER_DAY} intervalos.`;
    }
    for (const interval of intervals) {
      if (!TIME_REGEX.test(interval.startTime) || !TIME_REGEX.test(interval.endTime)) {
        return `${WEEKDAY_LABELS[day]}: informe horários no formato HH:mm.`;
      }
      if (timeToMinutes(interval.startTime) >= timeToMinutes(interval.endTime)) {
        return `${WEEKDAY_LABELS[day]}: o início deve ser anterior ao término.`;
      }
    }
    const sorted = [...intervals].sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
    );
    for (let i = 1; i < sorted.length; i++) {
      if (timeToMinutes(sorted[i].startTime) < timeToMinutes(sorted[i - 1].endTime)) {
        return `${WEEKDAY_LABELS[day]}: os intervalos não podem se sobrepor.`;
      }
    }
  }
  return null;
}

function formatDayStatus(intervals: WorkInterval[]): string {
  if (intervals.length === 0) return 'Folga';
  if (intervals.length === 1) {
    return `${intervals[0].startTime}–${intervals[0].endTime}`;
  }
  return `${intervals.length} intervalos`;
}

function createIntervalKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `interval-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type WorkScheduleEditorProps = {
  week: WeekSchedule;
  onChange: (week: WeekSchedule) => void;
  validationError?: string | null;
  disabled?: boolean;
};

/**
 * Editor de grade semanal com layout de dimensões estáveis:
 * - abas por dia (um dia por vez)
 * - slots de intervalo sempre reservados (sem crescer ao preencher)
 * - sem scroll interno
 */
export function WorkScheduleEditor({
  week,
  onChange,
  validationError = null,
  disabled = false,
}: WorkScheduleEditorProps) {
  const tabsId = useId();
  const panelId = `${tabsId}-panel`;
  const [activeDay, setActiveDay] = useState<WeekdayId>('mon');
  const [intervalKeys, setIntervalKeys] = useState<Record<WeekdayId, string[]>>(
    () =>
      Object.fromEntries(
        WEEKDAY_IDS.map((day) => [
          day,
          week[day].map(() => createIntervalKey()),
        ]),
      ) as Record<WeekdayId, string[]>,
  );

  const intervals = week[activeDay];
  const works = intervals.length > 0;
  const keys = intervalKeys[activeDay] ?? [];

  const updateDay = (
    weekday: WeekdayId,
    nextIntervals: WorkInterval[],
    nextKeys: string[],
  ) => {
    setIntervalKeys((prev) => ({ ...prev, [weekday]: nextKeys }));
    onChange({ ...week, [weekday]: nextIntervals });
  };

  const handleToggle = (active: boolean) => {
    if (active) {
      updateDay(activeDay, [{ startTime: '09:00', endTime: '18:00' }], [
        createIntervalKey(),
      ]);
    } else {
      updateDay(activeDay, [], []);
    }
  };

  const handleChangeInterval = (
    index: number,
    field: keyof WorkInterval,
    value: string,
  ) => {
    updateDay(
      activeDay,
      intervals.map((interval, i) =>
        i === index ? { ...interval, [field]: value } : interval,
      ),
      keys,
    );
  };

  const handleAddInterval = () => {
    if (intervals.length >= MAX_INTERVALS_PER_DAY) return;
    const last = intervals[intervals.length - 1];
    const startTime = last?.endTime || '09:00';
    updateDay(
      activeDay,
      [...intervals, { startTime, endTime: '18:00' }],
      [...keys, createIntervalKey()],
    );
  };

  const handleRemoveInterval = (index: number) => {
    updateDay(
      activeDay,
      intervals.filter((_, i) => i !== index),
      keys.filter((_, i) => i !== index),
    );
  };

  const handleFillAuto = () => {
    const defaults = createDefaultWeekSchedule();
    const nextKeys = WEEKDAY_IDS.reduce(
      (acc, day) => {
        acc[day] = defaults[day].map(() => createIntervalKey());
        return acc;
      },
      {} as Record<WeekdayId, string[]>,
    );
    setIntervalKeys(nextKeys);
    onChange(defaults);
  };

  const handleClear = () => {
    const emptyKeys = WEEKDAY_IDS.reduce(
      (acc, day) => {
        acc[day] = [];
        return acc;
      },
      {} as Record<WeekdayId, string[]>,
    );
    setIntervalKeys(emptyKeys);
    onChange(createEmptyWeekSchedule());
  };

  const emptySlots = works
    ? Math.max(0, MAX_INTERVALS_PER_DAY - intervals.length)
    : 0;

  return (
    <Stack spacing={2} sx={{ width: '100%' }}>
      <Stack spacing={1} sx={{ minHeight: 40 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Tooltip title="Preencher automaticamente a grade padrão de Segunda a Sexta (09:00 às 18:00)">
            <span>
              <Button
                size="small"
                variant="outlined"
                color="primary"
                onClick={handleFillAuto}
                disabled={disabled}
                startIcon={<Icon name="calendar" size={16} />}
              >
                Auto
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Limpar todos os horários cadastrados na semana">
            <span>
              <Button size="small" variant="outlined" onClick={handleClear} disabled={disabled}>
                Limpar
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      <Paper
        variant="outlined"
        sx={{
          height: DAY_PANEL_HEIGHT,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.paper',
        }}
      >
        <Tabs
          id={tabsId}
          value={activeDay}
          onChange={(_, value: WeekdayId) => setActiveDay(value)}
          variant="fullWidth"
          aria-label="Dias da semana"
          sx={{
            minHeight: TABS_HEIGHT,
            height: TABS_HEIGHT,
            borderBottom: '1px solid',
            borderColor: 'divider',
            flexShrink: 0,
            '& .MuiTab-root': {
              minHeight: TABS_HEIGHT,
              minWidth: 0,
              py: 0,
              px: 0.5,
              fontSize: '0.8125rem',
              textTransform: 'none',
              fontWeight: 600,
            },
          }}
        >
          {WEEKDAY_IDS.map((day) => (
            <Tab
              key={day}
              value={day}
              id={`${tabsId}-tab-${day}`}
              aria-controls={panelId}
              disabled={disabled}
              label={
                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                  <span>{WEEKDAY_SHORT[day]}</span>
                  {week[day].length > 0 ? (
                    <Box
                      component="span"
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        flexShrink: 0,
                      }}
                    />
                  ) : null}
                </Stack>
              }
            />
          ))}
        </Tabs>

        <Box
          role="tabpanel"
          id={panelId}
          aria-labelledby={`${tabsId}-tab-${activeDay}`}
          sx={{
            height: DAY_PANEL_HEIGHT - TABS_HEIGHT,
            px: 2,
            py: 1,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <Stack
            direction="row"
            sx={{
              alignItems: 'center',
              height: DAY_HEADER_HEIGHT,
              flexShrink: 0,
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={works}
                  onChange={(e) => handleToggle(e.target.checked)}
                  size="small"
                  disabled={disabled}
                />
              }
              label={
                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                  {WEEKDAY_LABELS[activeDay]}
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontWeight: 400, ml: 1 }}
                  >
                    {works ? formatDayStatus(intervals) : 'Folga'}
                  </Typography>
                </Typography>
              }
              sx={{ m: 0, minWidth: 0 }}
            />
          </Stack>

          <Divider sx={{ my: 0.5, flexShrink: 0 }} />

          <Box
            sx={{
              height: INTERVALS_AREA_HEIGHT,
              flexShrink: 0,
              overflow: 'hidden',
              display: 'grid',
              gridTemplateRows: `repeat(${MAX_INTERVALS_PER_DAY}, ${INTERVAL_SLOT_HEIGHT}px)`,
            }}
          >
            {!works ? (
              <Stack
                sx={{
                  gridRow: `1 / span ${MAX_INTERVALS_PER_DAY}`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="calendar" size={28} sx={{ opacity: 0.35 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Folga neste dia
                </Typography>
              </Stack>
            ) : (
              <>
                {intervals.map((interval, index) => (
                  <Stack
                    key={keys[index] ?? `${activeDay}-${index}`}
                    direction="row"
                    spacing={1}
                    sx={{
                      alignItems: 'center',
                      height: INTERVAL_SLOT_HEIGHT,
                      minHeight: INTERVAL_SLOT_HEIGHT,
                    }}
                  >
                    <TimePicker
                      label="Início"
                      size="small"
                      fullWidth={false}
                      value={interval.startTime}
                      minutesStep={5}
                      disabled={disabled}
                      onChange={(time) =>
                        handleChangeInterval(index, 'startTime', time ?? interval.startTime)
                      }
                      sx={{ width: 220 }}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ px: 0.5 }}>
                      —
                    </Typography>
                    <TimePicker
                      label="Fim"
                      size="small"
                      fullWidth={false}
                      value={interval.endTime}
                      minutesStep={5}
                      disabled={disabled}
                      onChange={(time) =>
                        handleChangeInterval(index, 'endTime', time ?? interval.endTime)
                      }
                      sx={{ width: 220 }}
                    />
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveInterval(index)}
                      aria-label="Remover intervalo"
                      disabled={disabled || intervals.length <= 1}
                    >
                      <Icon name="delete" size={16} />
                    </IconButton>
                  </Stack>
                ))}

                {Array.from({ length: emptySlots }).map((_, index) => (
                  <Box key={`empty-${index}`} aria-hidden />
                ))}
              </>
            )}
          </Box>

          <Box
            sx={{
              height: DAY_ACTION_HEIGHT,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {works && intervals.length < MAX_INTERVALS_PER_DAY ? (
              <Button
                size="small"
                variant="text"
                color="primary"
                startIcon={<Icon name="plus" size={16} />}
                onClick={handleAddInterval}
                disabled={disabled}
              >
                Adicionar intervalo
              </Button>
            ) : works ? (
              <Typography variant="caption" color="text.secondary">
                Limite de {MAX_INTERVALS_PER_DAY} intervalos atingido
              </Typography>
            ) : null}
          </Box>
        </Box>
      </Paper>

      <Box
        sx={{
          height: ALERT_SLOT_HEIGHT,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'stretch',
        }}
      >
        {validationError ? (
          <Alert severity="error" sx={{ width: '100%', py: 0.5 }}>
            {validationError}
          </Alert>
        ) : (
          <Box aria-hidden sx={{ width: '100%' }} />
        )}
      </Box>
    </Stack>
  );
}
