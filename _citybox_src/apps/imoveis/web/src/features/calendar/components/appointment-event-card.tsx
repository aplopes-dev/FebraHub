'use client';

import { useTheme } from '@mui/material/styles';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Box, Stack, Typography } from '@citybox/mui/atoms';
import { APPOINTMENT_KIND_LABEL, type CalendarAppointment } from '../types';
import {
  APPOINTMENT_CARD_SHADOW,
  getAppointmentKindSurface,
} from '../utils/appointment-kind-styles';
import {
  formatAppointmentDate,
  formatAppointmentStartTime,
  formatAppointmentTimeRange,
} from '../utils/format-appointment-time';

export type AppointmentEventCardDensity = 'xs' | 'sm' | 'md' | 'lg';

type AppointmentEventCardProps = {
  appointment: CalendarAppointment;
  className?: string;
  /** Compacto força tipografia menor (colunas estreitas / mês). */
  compact?: boolean;
  /** Mobile (grade dia/semana): só nome + data + motivo, sem horário e sem lead. */
  showDateAndKind?: boolean;
  /**
   * Densidade pelo espaço vertical disponível.
   * Evita empilhar linhas que se sobrepõem em cards baixos.
   */
  density?: AppointmentEventCardDensity;
  /** Na grade dia/semana: só horário de início; popover/sheet mantém intervalo completo. */
  showEndTime?: boolean;
  /**
   * `card` — layout Listify vertical (Figma 18165:10599).
   * `slot` — chip horizontal compacto (mês / slots empilhados).
   */
  variant?: 'card' | 'slot' | 'default';
};

/** Deriva densidade a partir da altura em px do bloco na grade. */
export function densityFromHeight(heightPx: number): AppointmentEventCardDensity {
  if (heightPx < 40) return 'xs';
  if (heightPx < 64) return 'sm';
  if (heightPx < 90) return 'md';
  return 'lg';
}

const CARD_PADDING: Record<
  AppointmentEventCardDensity,
  { px: number; py: number }
> = {
  xs: { px: 1, py: 0.25 },
  sm: { px: 1.25, py: 0.75 },
  md: { px: 1.5, py: 1 },
  lg: { px: 1.5, py: 1.25 },
};

/**
 * Métricas de texto do card minimal (nome/data/horário/motivo) por densidade.
 * Garantem que as linhas renderizadas cabem na altura disponível sem cortar.
 */
const MINIMAL_TEXT: Record<
  AppointmentEventCardDensity,
  { title: number; info: number; lh: number; gap: number; py: number }
> = {
  xs: { title: 11, info: 10, lh: 1.05, gap: 0, py: 0.25 },
  sm: { title: 11, info: 10, lh: 1.05, gap: 0, py: 0.25 },
  md: { title: 12, info: 10, lh: 1.15, gap: 0.25, py: 0.5 },
  lg: { title: 14, info: 12, lh: 1.2, gap: 0.375, py: 1 },
};

/** Linhas que cabem na altura: xs=nome+horário · sm=+data · md/lg=+motivo. */
const MINIMAL_LINES: Record<
  AppointmentEventCardDensity,
  { date: boolean; kind: boolean }
> = {
  xs: { date: false, kind: false },
  sm: { date: true, kind: false },
  md: { date: true, kind: true },
  lg: { date: true, kind: true },
};

/**
 * Card do compromisso — Listify (Figma node 18165:10599).
 * Título do compromisso → lead (opcional) → horário → tipo.
 */
export function AppointmentEventCard({
  appointment,
  className,
  compact = false,
  density = 'md',
  showEndTime = true,
  showDateAndKind = false,
  variant = 'card',
}: AppointmentEventCardProps) {
  const theme = useTheme();
  const compromissoTitle = appointment.title;
  const leadName =
    appointment.leadName != null && appointment.leadName.trim().length > 0
      ? appointment.leadName
      : null;
  const kindLabel = APPOINTMENT_KIND_LABEL[appointment.kind];
  const surface = getAppointmentKindSurface(theme);
  const timeLabel = showEndTime
    ? formatAppointmentTimeRange(appointment.startTime, appointment.endTime)
    : formatAppointmentStartTime(appointment.startTime);

  const resolvedVariant = variant === 'default' ? 'card' : variant;
  const padding = CARD_PADDING[density];

  if (resolvedVariant === 'slot' || density === 'xs') {
    if (showDateAndKind) {
      return (
        <Stack
          direction="column"
          className={className}
          sx={{
            alignItems: 'stretch',
            justifyContent: 'flex-start',
            height: '100%',
            minHeight: 0,
            minWidth: 0,
            overflow: 'hidden',
            borderRadius: compact ? '8px' : '12px',
            bgcolor: surface.bg,
            border: '1px solid',
            borderColor: surface.border,
            boxShadow: APPOINTMENT_CARD_SHADOW,
            px: compact ? 1 : padding.px,
            py: 0.25,
          }}
        >
          <Typography
            component="span"
            sx={{
              width: '100%',
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: compact ? 10 : MINIMAL_TEXT.xs.title,
              fontWeight: 600,
              lineHeight: MINIMAL_TEXT.xs.lh,
              color: 'text.primary',
            }}
          >
            {compromissoTitle}
          </Typography>
          <Typography
            component="span"
            sx={{
              width: '100%',
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: compact ? 10 : MINIMAL_TEXT.xs.info,
              fontWeight: 400,
              lineHeight: MINIMAL_TEXT.xs.lh,
              color: 'text.secondary',
            }}
          >
            {timeLabel}
          </Typography>
        </Stack>
      );
    }
    return (
      <Stack
        direction="row"
        spacing={0.75}
        className={className}
        sx={{
          alignItems: 'center',
          height: '100%',
          minHeight: compact ? 22 : 0,
          minWidth: 0,
          overflow: 'hidden',
          borderRadius: compact ? '8px' : '12px',
          bgcolor: surface.bg,
          border: '1px solid',
          borderColor: surface.border,
          boxShadow: APPOINTMENT_CARD_SHADOW,
          px: compact ? 1 : padding.px,
          py: compact ? 0.25 : padding.py,
        }}
      >
        <Typography
          component="span"
          sx={{
            flex: '1 1 auto',
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: compact ? 10 : 12,
            fontWeight: 600,
            lineHeight: 1.25,
            color: 'text.primary',
          }}
        >
          {compromissoTitle}
        </Typography>
        <Typography
          component="span"
          sx={{
            flex: '0 1 auto',
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: compact ? 10 : 11,
            fontWeight: 400,
            lineHeight: 1.25,
            color: 'text.secondary',
          }}
        >
          {timeLabel}
        </Typography>
      </Stack>
    );
  }

  const showLead = !showDateAndKind && Boolean(leadName) && density !== 'sm';
  const showKind = !showDateAndKind && (density === 'md' || density === 'lg');
  const titleFontSize = compact ? 12 : density === 'sm' ? 13 : 14;

  const minimalText = MINIMAL_TEXT[density];
  const minimalLines = MINIMAL_LINES[density];
  const minimalTitleSize = compact
    ? Math.max(10, minimalText.title - 1)
    : minimalText.title;
  const minimalInfoSize = compact
    ? Math.max(9, minimalText.info - 1)
    : minimalText.info;

  return (
    <Box
      className={className}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        justifyContent: 'flex-start',
        height: '100%',
        minHeight: 0,
        minWidth: 0,
        overflow: 'hidden',
        borderRadius: density === 'sm' ? '12px' : '16px',
        bgcolor: surface.bg,
        border: '1px solid',
        borderColor: surface.border,
        boxShadow: APPOINTMENT_CARD_SHADOW,
        px: compact ? 1.25 : padding.px,
        py: showDateAndKind
          ? compact
            ? 0.5
            : minimalText.py
          : compact
            ? 0.75
            : padding.py,
        gap: showDateAndKind
          ? minimalText.gap
          : density === 'sm'
            ? 0.375
            : 0.5,
      }}
    >
      <Typography
        sx={{
          width: '100%',
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontWeight: 600,
          fontSize: showDateAndKind ? minimalTitleSize : titleFontSize,
          lineHeight: showDateAndKind ? minimalText.lh : 1.25,
          color: 'text.primary',
        }}
      >
        {compromissoTitle}
      </Typography>

      {showDateAndKind ? (
        <>
          {minimalLines.date ? (
            <Typography
              sx={{
                width: '100%',
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontWeight: 400,
                fontSize: minimalInfoSize,
                lineHeight: minimalText.lh,
                color: 'text.secondary',
              }}
            >
              {formatAppointmentDate(appointment.date)}
            </Typography>
          ) : null}
          <Typography
            sx={{
              width: '100%',
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: 400,
              fontSize: minimalInfoSize,
              lineHeight: minimalText.lh,
              color: 'text.secondary',
            }}
          >
            {timeLabel}
          </Typography>
          {minimalLines.kind ? (
            <Typography
              sx={{
                width: '100%',
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontWeight: 400,
                fontSize: minimalInfoSize,
                lineHeight: minimalText.lh,
                color: 'text.secondary',
              }}
            >
              {kindLabel}
            </Typography>
          ) : null}
        </>
      ) : (
        <>
          {showLead && leadName ? (
            <Typography
              sx={{
                width: '100%',
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontWeight: 400,
                fontSize: compact ? 11 : 12,
                lineHeight: 1.25,
                color: 'text.secondary',
              }}
            >
              {leadName}
            </Typography>
          ) : null}

          <Box
            sx={{
              minWidth: 0,
              mt: density === 'lg' ? 'auto' : 0,
              pt: density === 'lg' ? 0.25 : 0,
            }}
          >
            <Stack
              direction="row"
              spacing={0.5}
              sx={{ alignItems: 'center', minWidth: 0 }}
            >
              <AccessTimeIcon
                sx={{
                  fontSize: compact ? 13 : 14,
                  flexShrink: 0,
                  color: 'text.secondary',
                }}
                aria-hidden
              />
              <Typography
                component="span"
                sx={{
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: compact ? 11 : 12,
                  fontWeight: 400,
                  lineHeight: 1.25,
                  color: 'text.secondary',
                }}
              >
                {timeLabel}
              </Typography>
            </Stack>

            {showKind ? (
              <Typography
                sx={{
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: compact ? 11 : 12,
                  fontWeight: 400,
                  lineHeight: 1.25,
                  color: 'text.secondary',
                  mt: 0.25,
                }}
              >
                {kindLabel}
              </Typography>
            ) : null}
          </Box>
        </>
      )}
    </Box>
  );
}
