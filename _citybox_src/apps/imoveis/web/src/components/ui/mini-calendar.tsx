'use client';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, IconButton, Stack, Typography } from '@citybox/mui/atoms';
import {
  WEEK_DAY_NAMES,
  getMonthDays,
  getMonthLabel,
  type MonthRef,
} from '@/features/shared/utils/calendar';
import { primarySoftShadow } from '@/theme/accent-styles';

type MiniCalendarProps = {
  month: MonthRef;
  selectedDay: number;
  /** Dias que recebem o ponto indicador de evento. */
  markedDays?: readonly number[];
  onMonthChange: (direction: -1 | 1) => void;
  onSelectDay: (day: number) => void;
  /** Menor — painel lateral da agenda. */
  compact?: boolean;
};

/** Calendário compacto do painel — específico do Imóveis (MUI). */
export function MiniCalendar({
  month,
  selectedDay,
  markedDays = [],
  onMonthChange,
  onSelectDay,
  compact = false,
}: MiniCalendarProps) {
  const days = getMonthDays(month);
  const daySize = compact ? 28 : 36;
  const navSize = compact ? 28 : 32;

  return (
    <Stack spacing={compact ? 1 : 2}>
      <Stack
        component="header"
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Typography
          component="h2"
          sx={{
            fontWeight: 600,
            letterSpacing: '-0.025em',
            fontSize: compact ? '1rem' : '1.5rem',
          }}
        >
          {getMonthLabel(month)}
        </Typography>
        <Stack direction="row" spacing={0.25} sx={{ alignItems: 'center' }}>
          <IconButton
            type="button"
            aria-label="Mês anterior"
            size="small"
            onClick={() => onMonthChange(-1)}
            sx={{
              width: navSize,
              height: navSize,
              color: 'text.secondary',
              '&:hover': { bgcolor: 'secondary.main', color: 'text.primary' },
            }}
          >
            <ChevronLeftIcon sx={{ fontSize: compact ? 16 : 20 }} />
          </IconButton>
          <IconButton
            type="button"
            aria-label="Próximo mês"
            size="small"
            onClick={() => onMonthChange(1)}
            sx={{
              width: navSize,
              height: navSize,
              color: 'text.secondary',
              '&:hover': { bgcolor: 'secondary.main', color: 'text.primary' },
            }}
          >
            <ChevronRightIcon sx={{ fontSize: compact ? 16 : 20 }} />
          </IconButton>
        </Stack>
      </Stack>

      <Box
        component="table"
        sx={{
          width: '100%',
          borderCollapse: 'separate',
          borderSpacing: compact ? '0' : '0 4px',
        }}
      >
        <Box component="thead">
          <Box component="tr">
            {WEEK_DAY_NAMES.map((weekDay) => (
              <Box
                key={weekDay}
                component="th"
                scope="col"
                sx={{
                  pb: compact ? 0.25 : 0.5,
                  fontWeight: 400,
                  color: 'text.secondary',
                  fontSize: compact ? 10 : '0.875rem',
                }}
              >
                {weekDay}
              </Box>
            ))}
          </Box>
        </Box>
        <Box component="tbody">
          {chunk(days, 7).map((week, weekIndex) => (
            <Box component="tr" key={weekIndex}>
              {week.map((day, dayIndex) => (
                <Box
                  key={day ?? `empty-${dayIndex}`}
                  component="td"
                  sx={{ textAlign: 'center' }}
                >
                  {day === null ? (
                    <Box
                      component="span"
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: daySize,
                        height: daySize,
                        color: 'text.disabled',
                        fontSize: compact ? '0.75rem' : undefined,
                      }}
                    >
                      ·
                    </Box>
                  ) : (
                    <Box
                      component="button"
                      type="button"
                      onClick={() => onSelectDay(day)}
                      aria-current={day === selectedDay ? 'date' : undefined}
                      sx={{
                        position: 'relative',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: daySize,
                        height: daySize,
                        border: 0,
                        cursor: 'pointer',
                        borderRadius: compact ? 1 : 2,
                        fontSize: compact ? '0.75rem' : '1rem',
                        transition: 'background-color 0.15s, color 0.15s',
                        ...(day === selectedDay
                          ? {
                              bgcolor: 'primary.main',
                              color: 'primary.contrastText',
                              fontWeight: 500,
                              boxShadow: (theme) => primarySoftShadow(theme),
                            }
                          : {
                              bgcolor: 'transparent',
                              color: 'text.primary',
                              '&:hover': { bgcolor: 'secondary.main' },
                            }),
                      }}
                    >
                      {day}
                      {markedDays.includes(day) && day !== selectedDay && (
                        <Box
                          component="span"
                          sx={{
                            position: 'absolute',
                            bottom: 2,
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            bgcolor: 'info.main',
                          }}
                        />
                      )}
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      </Box>
    </Stack>
  );
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, index * size + size),
  );
}
