'use client';

import { cloneElement, useMemo, useState, type MouseEvent, type ReactElement } from 'react';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import type { PopoverOrigin } from '@mui/material/Popover';
import {
  Avatar,
  Box,
  Button,
  Popover,
  Stack,
  Typography,
} from '@citybox/mui/atoms';
import { LeadContactPhoneButton } from '@/components/lead-contact-phone-button';
import { listifyPopoverPaperSx } from '@/theme/accent-styles';
import { listifyElevatedSurface } from '@/theme/listify-field-styles';
import {
  listifyShadows,
  listifySuccess,
} from '@/theme/tokens';
import { APPOINTMENT_KIND_LABEL, type CalendarAppointment } from '../types';
import { formatAppointmentTimeRange } from '../utils/format-appointment-time';
import { resolveLeadContact } from '../utils/lead-contact';
import { AppointmentDetailSheet } from './appointment-detail-sheet';

type AppointmentPopoverProps = {
  appointment: CalendarAppointment;
  onEdit: (appointment: CalendarAppointment) => void;
  children: ReactElement<{ onClick?: (event: MouseEvent) => void }>;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1]?.[0] ?? ''}`.toUpperCase();
}

function popoverOrigins(
  side: NonNullable<AppointmentPopoverProps['side']>,
  align: NonNullable<AppointmentPopoverProps['align']>,
): { anchorOrigin: PopoverOrigin; transformOrigin: PopoverOrigin } {
  const verticalAlign: PopoverOrigin['vertical'] =
    align === 'start' ? 'top' : align === 'end' ? 'bottom' : 'center';
  const horizontalAlign: PopoverOrigin['horizontal'] =
    align === 'start' ? 'left' : align === 'end' ? 'right' : 'center';

  switch (side) {
    case 'top':
      return {
        anchorOrigin: { vertical: 'top', horizontal: horizontalAlign },
        transformOrigin: { vertical: 'bottom', horizontal: horizontalAlign },
      };
    case 'bottom':
      return {
        anchorOrigin: { vertical: 'bottom', horizontal: horizontalAlign },
        transformOrigin: { vertical: 'top', horizontal: horizontalAlign },
      };
    case 'left':
      return {
        anchorOrigin: { vertical: verticalAlign, horizontal: 'left' },
        transformOrigin: { vertical: verticalAlign, horizontal: 'right' },
      };
    case 'right':
    default:
      return {
        anchorOrigin: { vertical: verticalAlign, horizontal: 'right' },
        transformOrigin: { vertical: verticalAlign, horizontal: 'left' },
      };
  }
}

type AppointmentPopoverBodyProps = {
  appointment: CalendarAppointment;
  onEdit: () => void;
  onViewDetails: () => void;
};

/**
 * Corpo do popover Listify — avatar + nome/título + telefone;
 * horário com ícone laranja; linha `{tipo}: {local}`.
 */
export function AppointmentPopoverBody({
  appointment,
  onEdit,
  onViewDetails,
}: AppointmentPopoverBodyProps) {
  const name = appointment.leadName ?? appointment.title;
  const subtitle = appointment.leadName ? appointment.title : null;
  const contact = useMemo(() => resolveLeadContact(appointment), [appointment]);
  const kindLabel = APPOINTMENT_KIND_LABEL[appointment.kind];
  const locationLine = appointment.location
    ? `${kindLabel}: ${appointment.location}`
    : kindLabel;

  return (
    <Stack spacing={2}>
      <Stack
        direction="row"
        spacing={1.5}
        sx={{ alignItems: 'center', minWidth: 0 }}
      >
        <Avatar
          src={appointment.leadPhotoUrl ?? undefined}
          alt={name}
          sx={{
            width: 48,
            height: 48,
            flexShrink: 0,
            bgcolor: listifySuccess[25],
            color: listifySuccess[300],
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {initials(name)}
        </Avatar>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            noWrap
            sx={{
              fontSize: 16,
              fontWeight: 700,
              lineHeight: 1.35,
              letterSpacing: '-0.02em',
              color: 'text.primary',
            }}
          >
            {name}
          </Typography>
          {subtitle ? (
            <Typography
              noWrap
              sx={{
                mt: 0.25,
                fontSize: 13,
                fontWeight: 400,
                lineHeight: 1.4,
                color: 'text.secondary',
              }}
            >
              {subtitle}
            </Typography>
          ) : null}
        </Box>

        <LeadContactPhoneButton
          contact={contact}
          size="md"
          variant="popover"
          side="top"
          align="end"
          sideOffset={10}
          nested
          sx={(theme) => ({
            bgcolor: listifyElevatedSurface(theme),
            color: 'text.primary',
            boxShadow: listifyShadows.xs,
            '&:hover': {
              bgcolor: listifyElevatedSurface(theme),
              color: 'primary.main',
            },
          })}
        />
      </Stack>

      <Box sx={{ minWidth: 0 }}>
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center', minWidth: 0 }}
        >
          <AccessTimeIcon
            sx={{ fontSize: 18, flexShrink: 0, color: 'primary.main' }}
            aria-hidden
          />
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 600,
              lineHeight: 1.4,
              color: 'text.primary',
            }}
          >
            {formatAppointmentTimeRange(
              appointment.startTime,
              appointment.endTime,
            )}
          </Typography>
        </Stack>

        <Typography
          sx={{
            mt: 0.75,
            fontSize: 13,
            fontWeight: 400,
            lineHeight: 1.45,
            color: 'text.secondary',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {locationLine}
        </Typography>
      </Box>

      <Stack direction="row" spacing={2} sx={{ pt: 0.25 }}>
        <Button
          type="button"
          variant="text"
          onClick={onViewDetails}
          sx={{
            minWidth: 0,
            p: 0,
            fontSize: 12,
            fontWeight: 500,
            color: 'text.secondary',
            textTransform: 'none',
            '&:hover': { bgcolor: 'transparent', color: 'text.primary' },
          }}
        >
          Ver detalhes
        </Button>
        <Button
          type="button"
          variant="text"
          onClick={onEdit}
          sx={{
            minWidth: 0,
            p: 0,
            fontSize: 12,
            fontWeight: 500,
            color: 'text.secondary',
            textTransform: 'none',
            '&:hover': { bgcolor: 'transparent', color: 'text.primary' },
          }}
        >
          Editar
        </Button>
      </Stack>
    </Stack>
  );
}

/** @deprecated Use `AppointmentPopover`. */
export const AppointmentHoverCardBody = AppointmentPopoverBody;

/**
 * Popover Listify no clique — fundo cream do accent, radius 24, avatar + telefone + horário/local.
 */
export function AppointmentPopover({
  appointment,
  onEdit,
  children,
  side = 'right',
  align = 'start',
}: AppointmentPopoverProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const open = Boolean(anchorEl);
  const origins = popoverOrigins(side, align);

  function handleEdit() {
    setAnchorEl(null);
    setDetailOpen(false);
    onEdit(appointment);
  }

  function handleViewDetails() {
    setAnchorEl(null);
    setDetailOpen(true);
  }

  const trigger = cloneElement(children, {
    onClick: (event: MouseEvent) => {
      event.stopPropagation();
      children.props.onClick?.(event);
      setAnchorEl(event.currentTarget as HTMLElement);
    },
  });

  return (
    <>
      {trigger}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={origins.anchorOrigin}
        transformOrigin={origins.transformOrigin}
        disableScrollLock
        slotProps={{
          paper: {
            sx: (theme) =>
              listifyPopoverPaperSx(theme, {
                width: 300,
                maxWidth: 'calc(100vw - 32px)',
                p: 2.5,
              }),
          },
        }}
      >
        <AppointmentPopoverBody
          appointment={appointment}
          onEdit={handleEdit}
          onViewDetails={handleViewDetails}
        />
      </Popover>

      <AppointmentDetailSheet
        appointment={appointment}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={handleEdit}
      />
    </>
  );
}

/** @deprecated Use `AppointmentPopover`. */
export const AppointmentHoverCard = AppointmentPopover;
