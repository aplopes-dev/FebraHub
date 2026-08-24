'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Stack,
  Switch,
  Typography,
} from '@citybox/mui/atoms';
import { TimePicker } from '@citybox/mui/molecules';
import { Icon } from '@citybox/mui/icons';
import {
  WEEKDAY_IDS,
  WEEKDAY_LABELS,
  createEmptyWeekSchedule,
  type WeekdayId,
  type WeekSchedule,
  type WorkInterval,
} from '@/lib/work-schedule';
import { settingsInputSx, mutedForeground, settingsMutedTextSx } from '@/features/settings/lib/settings-muted';

export const MAX_INTERVALS_PER_DAY = 5;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function validateWeekSchedule(week: WeekSchedule): string | null {
  for (const day of WEEKDAY_IDS) {
    const intervals = week[day];
    if (intervals.length > MAX_INTERVALS_PER_DAY) {
      return `${WEEKDAY_LABELS[day]}: no máximo ${MAX_INTERVALS_PER_DAY} turnos por dia.`;
    }
    for (const interval of intervals) {
      if (!TIME_REGEX.test(interval.startTime) || !TIME_REGEX.test(interval.endTime)) {
        return `${WEEKDAY_LABELS[day]}: informe horários válidos no formato HH:mm.`;
      }
      if (timeToMinutes(interval.startTime) >= timeToMinutes(interval.endTime)) {
        return `${WEEKDAY_LABELS[day]}: o horário de início deve ser anterior ao término.`;
      }
    }
    const sorted = [...intervals].sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
    );
    for (let i = 1; i < sorted.length; i++) {
      if (timeToMinutes(sorted[i].startTime) < timeToMinutes(sorted[i - 1].endTime)) {
        return `${WEEKDAY_LABELS[day]}: os horários não podem se sobrepor.`;
      }
    }
  }
  return null;
}

function createIntervalKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `interval-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type StoreWorkScheduleEditorProps = {
  week: WeekSchedule;
  onChange: (week: WeekSchedule) => void;
  disabled?: boolean;
};

export function StoreWorkScheduleEditor({
  week,
  onChange,
  disabled = false,
}: StoreWorkScheduleEditorProps) {
  const [intervalKeys, setIntervalKeys] = useState<Record<WeekdayId, string[]>>(
    () =>
      Object.fromEntries(
        WEEKDAY_IDS.map((day) => [day, week[day].map(() => createIntervalKey())]),
      ) as Record<WeekdayId, string[]>,
  );

  const updateDay = (
    weekday: WeekdayId,
    nextIntervals: WorkInterval[],
    nextKeys: string[],
  ) => {
    setIntervalKeys((prev) => ({ ...prev, [weekday]: nextKeys }));
    onChange({ ...week, [weekday]: nextIntervals });
  };

  const handleToggleDay = (weekday: WeekdayId, active: boolean) => {
    if (active) {
      updateDay(weekday, [{ startTime: '09:00', endTime: '18:00' }], [createIntervalKey()]);
    } else {
      updateDay(weekday, [], []);
    }
  };

  const handleChangeInterval = (
    weekday: WeekdayId,
    index: number,
    field: keyof WorkInterval,
    value: string,
  ) => {
    const currentIntervals = week[weekday];
    const currentKeys = intervalKeys[weekday] ?? [];
    updateDay(
      weekday,
      currentIntervals.map((interval, i) =>
        i === index ? { ...interval, [field]: value } : interval,
      ),
      currentKeys,
    );
  };

  const handleAddInterval = (weekday: WeekdayId) => {
    const currentIntervals = week[weekday];
    if (currentIntervals.length >= MAX_INTERVALS_PER_DAY) return;
    const last = currentIntervals[currentIntervals.length - 1];
    const startTime = last?.endTime || '09:00';
    const currentKeys = intervalKeys[weekday] ?? [];
    updateDay(
      weekday,
      [...currentIntervals, { startTime, endTime: '18:00' }],
      [...currentKeys, createIntervalKey()],
    );
  };

  const handleRemoveInterval = (weekday: WeekdayId, index: number) => {
    const currentIntervals = week[weekday];
    const currentKeys = intervalKeys[weekday] ?? [];
    updateDay(
      weekday,
      currentIntervals.filter((_, i) => i !== index),
      currentKeys.filter((_, i) => i !== index),
    );
  };

  const applyCommercialPreset = () => {
    const workday: WorkInterval[] = [
      { startTime: '08:00', endTime: '12:00' },
      { startTime: '13:00', endTime: '18:00' },
    ];
    const nextWeek: WeekSchedule = {
      mon: workday.map((interval) => ({ ...interval })),
      tue: workday.map((interval) => ({ ...interval })),
      wed: workday.map((interval) => ({ ...interval })),
      thu: workday.map((interval) => ({ ...interval })),
      fri: workday.map((interval) => ({ ...interval })),
      sat: [],
      sun: [],
    };
    const nextKeys = WEEKDAY_IDS.reduce(
      (acc, day) => {
        acc[day] = nextWeek[day].map(() => createIntervalKey());
        return acc;
      },
      {} as Record<WeekdayId, string[]>,
    );
    setIntervalKeys(nextKeys);
    onChange(nextWeek);
  };

  const applySaturdayPreset = () => {
    const satIntervals: WorkInterval[] = [{ startTime: '08:00', endTime: '12:00' }];
    setIntervalKeys((prev) => ({
      ...prev,
      sat: satIntervals.map(() => createIntervalKey()),
    }));
    onChange({ ...week, sat: satIntervals });
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

  return (
    <Stack spacing={2.5}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Icon name="clock" size={16} sx={{ color: (theme) => mutedForeground(theme) }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 500, lineHeight: 1.3 }}>
            Horário de funcionamento
          </Typography>
        </Stack>

        <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
          <Button size="small" variant="text" onClick={applyCommercialPreset} disabled={disabled}>
            Seg–Sex comercial
          </Button>
          <Button size="small" variant="text" onClick={applySaturdayPreset} disabled={disabled}>
            + Sábado manhã
          </Button>
          <Button
            size="small"
            variant="text"
            color="error"
            onClick={handleClear}
            disabled={disabled}
          >
            Limpar
          </Button>
        </Stack>
      </Stack>

      {WEEKDAY_IDS.map((day, dayIndex) => {
        const intervals = week[day];
        const isOpen = intervals.length > 0;
        const dayKeys = intervalKeys[day] ?? [];

        return (
          <Box key={day}>
            {dayIndex > 0 ? <Divider sx={{ mb: 2.5 }} /> : null}

            <Stack spacing={1.5}>
              <Stack
                direction="row"
                spacing={2}
                sx={{ alignItems: 'center', justifyContent: 'space-between' }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {WEEKDAY_LABELS[day]}
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isOpen}
                      onChange={(event) => handleToggleDay(day, event.target.checked)}
                      size="small"
                      disabled={disabled}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={settingsMutedTextSx}>
                      {isOpen ? 'Aberto' : 'Fechado'}
                    </Typography>
                  }
                  sx={{ m: 0 }}
                />
              </Stack>

              {isOpen
                ? intervals.map((interval, index) => (
                    <Grid
                      key={dayKeys[index] ?? `${day}-${index}`}
                      container
                      spacing={1.5}
                      sx={{ alignItems: 'center' }}
                    >
                      <Grid size={{ xs: 12, sm: 5 }}>
                        <TimePicker
                          label="Início"
                          value={interval.startTime}
                          minutesStep={15}
                          disabled={disabled}
                          sx={settingsInputSx}
                          onChange={(time) =>
                            handleChangeInterval(day, index, 'startTime', time ?? interval.startTime)
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 5 }}>
                        <TimePicker
                          label="Término"
                          value={interval.endTime}
                          minutesStep={15}
                          disabled={disabled}
                          sx={settingsInputSx}
                          onChange={(time) =>
                            handleChangeInterval(day, index, 'endTime', time ?? interval.endTime)
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 2 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveInterval(day, index)}
                          aria-label={`Remover turno de ${WEEKDAY_LABELS[day]}`}
                          disabled={disabled || intervals.length <= 1}
                        >
                          <Icon name="delete" size={18} />
                        </IconButton>
                      </Grid>
                    </Grid>
                  ))
                : null}

              {isOpen && intervals.length < MAX_INTERVALS_PER_DAY ? (
                <Box>
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<Icon name="plus" size={16} />}
                    onClick={() => handleAddInterval(day)}
                    disabled={disabled}
                  >
                    Adicionar intervalo
                  </Button>
                </Box>
              ) : null}
            </Stack>
          </Box>
        );
      })}
    </Stack>
  );
}
