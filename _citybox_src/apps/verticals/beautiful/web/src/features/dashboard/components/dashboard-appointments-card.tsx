'use client';

import Link from 'next/link';
import { alpha } from '@mui/material/styles';
import {
  Box,
  Button,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@citybox/mui/atoms';
import { Icon } from '@citybox/mui/icons';
import { ScrollArea } from '@citybox/mui/molecules';
import { formatCurrencyBRL } from '@/features/agenda/utils/agenda-date';
import { AppointmentStatusBadge } from '@/features/agenda/components/appointment-status-badge';
import type { AgendaAppointment } from '@/features/agenda/types/agenda.types';
import { DashboardPanel } from './dashboard-panel';

const VISIBLE_APPOINTMENT_CARDS = 3;
/** Altura de uma linha da timeline (padding + card). */
const APPOINTMENT_RAIL_HEIGHT_PX = 96;

type DashboardAppointmentsCardProps = {
  appointments: AgendaAppointment[];
  isLoading?: boolean;
  isError?: boolean;
};

export function DashboardAppointmentsCard({
  appointments,
  isLoading = false,
  isError = false,
}: DashboardAppointmentsCardProps) {
  return (
    <DashboardPanel>
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          pt: 2.75,
          pb: 0.5,
          gap: 2,
        }}
      >
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.05rem' }}>
            Agendamentos de hoje
          </Typography>
          <Box
            component="span"
            sx={(theme) => ({
              fontSize: 11,
              fontWeight: 600,
              color: 'primary.main',
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              border: '1px solid',
              borderColor: alpha(theme.palette.primary.main, 0.22),
              px: 1.25,
              py: 0.35,
              borderRadius: 5,
            })}
          >
            {appointments.length} total
          </Box>
        </Stack>
        <Button
          component={Link}
          href="/agenda"
          variant="text"
          size="small"
          color="primary"
          endIcon={<Icon name="chevron-right" size={13} />}
          sx={{ fontWeight: 600, fontSize: 12.5, flexShrink: 0 }}
        >
          Ver agenda completa
        </Button>
      </Stack>

      <Box sx={{ px: 3, pt: 2.25, pb: 2.75 }}>
        {isError ? (
          <Typography variant="body2" color="error">
            Não foi possível carregar os agendamentos de hoje.
          </Typography>
        ) : isLoading ? (
          <Typography variant="body2" color="text.secondary">
            Carregando agenda do dia…
          </Typography>
        ) : appointments.length === 0 ? (
          <EmptyAgenda />
        ) : (
          <Stack spacing={0}>
            <ScrollArea
              sx={{
                maxHeight:
                  appointments.length > VISIBLE_APPOINTMENT_CARDS
                    ? VISIBLE_APPOINTMENT_CARDS * APPOINTMENT_RAIL_HEIGHT_PX
                    : undefined,
                pr: appointments.length > VISIBLE_APPOINTMENT_CARDS ? 0.5 : 0,
              }}
            >
              {appointments.map((appointment) => (
                <AppointmentRail key={appointment.id} appointment={appointment} />
              ))}
            </ScrollArea>
            {appointments.length <= VISIBLE_APPOINTMENT_CARDS ? (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', pt: 1, pl: '73px', fontSize: 12.5, opacity: 0.85 }}
              >
                Sem mais horários marcados para hoje.
              </Typography>
            ) : null}
          </Stack>
        )}
      </Box>
    </DashboardPanel>
  );
}

function EmptyAgenda() {
  return (
    <Stack spacing={1.5} sx={{ alignItems: 'center', py: 3, textAlign: 'center' }}>
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          bgcolor: 'action.hover',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary',
        }}
      >
        <Icon name="calendar" size={28} />
      </Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        Nenhum agendamento para hoje
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
        Sua agenda está livre para hoje. Clique em &quot;Novo agendamento&quot; para cadastrar um horário.
      </Typography>
      <Button
        component={Link}
        href="/agenda"
        variant="outlined"
        size="small"
        color="primary"
        startIcon={<Icon name="plus" size={16} />}
        sx={{ mt: 0.5 }}
      >
        Novo agendamento
      </Button>
    </Stack>
  );
}

function AppointmentRail({ appointment }: { appointment: AgendaAppointment }) {
  const whatsappDigits = appointment.clientPhone?.replace(/\D/g, '') ?? '';
  const canWhatsApp = whatsappDigits.length >= 10;

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        height: APPOINTMENT_RAIL_HEIGHT_PX,
        py: 1.75,
        boxSizing: 'border-box',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 57,
          top: 6,
          bottom: 6,
          width: '1px',
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.22),
        },
      }}
    >
      <Box
        sx={{
          width: 57,
          flexShrink: 0,
          textAlign: 'right',
          pr: 2,
          position: 'relative',
        }}
      >
        <Typography
          variant="body2"
          sx={{ fontWeight: 600, fontSize: 13, fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}
        >
          {appointment.startTime}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontSize: 10.5, fontVariantNumeric: 'tabular-nums', display: 'block' }}
        >
          até {appointment.endTime}
        </Typography>
        <Box
          sx={(theme) => ({
            position: 'absolute',
            right: -4,
            top: 3,
            width: 9,
            height: 9,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.16)}`,
            zIndex: 1,
          })}
        />
      </Box>

      <Box
        sx={(theme) => ({
          flex: 1,
          minWidth: 0,
          bgcolor: alpha(theme.palette.primary.main, 0.08),
          border: '1px solid',
          borderColor: alpha(theme.palette.primary.main, 0.18),
          borderRadius: 1.6,
          px: 2,
          py: 1.75,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.75,
        })}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 600, fontSize: 14.5 }}>
            {appointment.clientName}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            sx={{ display: 'block', mt: 0.25, fontSize: 12 }}
          >
            {appointment.serviceName} · com {appointment.professionalName}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexShrink: 0 }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}
          >
            {formatCurrencyBRL(appointment.totalPrice)}
          </Typography>
          <AppointmentStatusBadge status={appointment.status} />
          {canWhatsApp ? (
            <Tooltip title="Conversar no WhatsApp">
              <IconButton
                size="small"
                color="primary"
                aria-label="Conversar no WhatsApp"
                onClick={() => {
                  window.open(
                    `https://wa.me/55${whatsappDigits}`,
                    '_blank',
                    'noopener,noreferrer',
                  );
                }}
                sx={(theme) => ({
                  width: 32,
                  height: 32,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: alpha(theme.palette.primary.main, 0.22),
                })}
              >
                <Icon name="phone" size={14} />
              </IconButton>
            </Tooltip>
          ) : null}
        </Stack>
      </Box>
    </Box>
  );
}
