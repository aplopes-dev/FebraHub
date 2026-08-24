'use client';

import { useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@citybox/mui/atoms';
import { Drawer, toast } from '@citybox/mui/molecules';
import { ConfirmationDialog } from '@citybox/mui/organisms';
import { Icon, type IconName } from '@citybox/mui/icons';
import type { ReactNode } from 'react';
import type { AgendaAppointment, AppointmentStatus } from '../types/agenda.types';
import { APPOINTMENT_STATUS_LABEL } from '../types/agenda.types';
import {
  formatCurrencyBRL,
  formatDayTitle,
  parseIsoDate,
} from '../utils/agenda-date';
import { useUpdateAppointmentStatusMutation } from '../hooks/use-appointments-queries';
import { AppointmentStatusBadge } from './appointment-status-badge';
import { useCan } from '@/features/permissions';

type AppointmentDetailsDrawerProps = {
  open: boolean;
  onClose: () => void;
  appointment: AgendaAppointment | null;
  onAppointmentUpdated?: (appointment: AgendaAppointment) => void;
  onEdit?: (appointment: AgendaAppointment) => void;
};

const STATUS_OPTIONS = Object.entries(APPOINTMENT_STATUS_LABEL) as Array<
  [AppointmentStatus, string]
>;

function clientInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDateLong(iso: string): string {
  const date = parseIsoDate(iso);
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: ReactNode;
}) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
      <Icon name={icon} size={18} sx={{ color: 'text.secondary', mt: 0.25 }} />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block' }}
        >
          {label}
        </Typography>
        {typeof value === 'string' ? (
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {value}
          </Typography>
        ) : (
          value
        )}
      </Box>
    </Stack>
  );
}

const DRAWER_WIDTH = 800;

export function AppointmentDetailsDrawer({
  open,
  onClose,
  appointment,
  onAppointmentUpdated,
  onEdit,
}: AppointmentDetailsDrawerProps) {
  /** Mantém o último agendamento para animar o fechamento do Drawer. */
  const [displayed, setDisplayed] = useState<AgendaAppointment | null>(
    appointment,
  );
  const [status, setStatus] = useState<AppointmentStatus>(
    appointment?.status ?? 'SCHEDULED',
  );
  const [cancelOpen, setCancelOpen] = useState(false);
  const updateStatusMutation = useUpdateAppointmentStatusMutation();
  const canUpdateSchedule =
    useCan('update', 'Schedule') || useCan('create', 'Schedule');
  const canDeleteSchedule = useCan('delete', 'Schedule');

  useEffect(() => {
    if (!appointment) return;
    setDisplayed(appointment);
    setStatus(appointment.status);
  }, [appointment]);

  if (!displayed) return null;

  const whatsappDigits = phoneDigits(displayed.clientPhone);
  const canOpenWhatsApp = whatsappDigits.length >= 10;
  const statusAllowsMutate =
    status !== 'CANCELLED' && status !== 'COMPLETED' && status !== 'NO_SHOW';
  const canCancel = statusAllowsMutate && canDeleteSchedule;
  const canEdit = statusAllowsMutate && canUpdateSchedule && Boolean(onEdit);
  const canChangeStatus = status !== 'COMPLETED' && canUpdateSchedule;

  const handleStatusChange = (nextStatus: AppointmentStatus) => {
    if (nextStatus === status || updateStatusMutation.isPending) return;

    const previous = status;
    setStatus(nextStatus);

    updateStatusMutation.mutate(
      { id: displayed.id, status: nextStatus },
      {
        onSuccess: (updated) => {
          setStatus(updated.status);
          setDisplayed(updated);
          onAppointmentUpdated?.(updated);
          toast.success('Status atualizado', {
            description: `${updated.clientName} · ${APPOINTMENT_STATUS_LABEL[updated.status]}.`,
          });
        },
        onError: () => {
          setStatus(previous);
          toast.error('Não foi possível atualizar o status', {
            description: 'Tente novamente em instantes.',
          });
        },
      },
    );
  };

  const handleConfirmCancel = () => {
    updateStatusMutation.mutate(
      { id: displayed.id, status: 'CANCELLED' },
      {
        onSuccess: (updated) => {
          setStatus(updated.status);
          setDisplayed(updated);
          onAppointmentUpdated?.(updated);
          setCancelOpen(false);
          toast.success('Agendamento cancelado', {
            description: `${updated.clientName} · ${updated.date} às ${updated.startTime}.`,
          });
        },
        onError: () => {
          toast.error('Não foi possível cancelar', {
            description: 'Tente novamente em instantes.',
          });
        },
      },
    );
  };

  return (
    <>
      <Drawer open={open} onClose={onClose} width={DRAWER_WIDTH}>
        <Box sx={{ p: 1 }}>
          <Stack
            direction="row"
            sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}
          >
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center', minWidth: 0 }}>
              <Avatar
                alt={displayed.clientName}
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: 'primary.main',
                  fontSize: 22,
                  fontWeight: 600,
                }}
              >
                {clientInitials(displayed.clientName) || '?'}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    lineHeight: 1.25,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {displayed.clientName}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                  Atendimento
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <AppointmentStatusBadge status={status} />
                </Box>
              </Box>
            </Stack>
            <IconButton onClick={onClose} size="small" aria-label="Fechar">
              <Icon name="close" size={20} />
            </IconButton>
          </Stack>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2, textTransform: 'capitalize' }}
          >
            {formatDateLong(displayed.date)} · {displayed.startTime} –{' '}
            {displayed.endTime}
          </Typography>

          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            {canEdit ? (
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                startIcon={<Icon name="edit" size={18} />}
                onClick={() => onEdit?.(displayed)}
                disabled={updateStatusMutation.isPending}
              >
                Editar / remarcar
              </Button>
            ) : null}
            {canCancel ? (
              <Button
                variant="outlined"
                color="error"
                fullWidth
                startIcon={<Icon name="close" size={18} />}
                onClick={() => setCancelOpen(true)}
                disabled={updateStatusMutation.isPending}
              >
                Cancelar
              </Button>
            ) : null}
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{
              mb: 1.5,
              textTransform: 'uppercase',
              fontSize: '0.75rem',
              letterSpacing: 0.5,
              fontWeight: 600,
            }}
          >
            Status
          </Typography>

          <FormControl
            fullWidth
            sx={{ mb: canChangeStatus ? 3 : 1 }}
            disabled={updateStatusMutation.isPending || !canChangeStatus}
          >
            <InputLabel id="appointment-details-status-label">Status do atendimento</InputLabel>
            <Select
              labelId="appointment-details-status-label"
              label="Status do atendimento"
              value={status}
              onChange={(event) =>
                handleStatusChange(event.target.value as AppointmentStatus)
              }
            >
              {STATUS_OPTIONS.map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {status === 'COMPLETED' ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mb: 3 }}
            >
              Atendimentos concluídos não podem ser alterados.
            </Typography>
          ) : !canUpdateSchedule ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mb: 3 }}
            >
              Você não tem permissão para alterar o status.
            </Typography>
          ) : null}

          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{
              mb: 1.5,
              textTransform: 'uppercase',
              fontSize: '0.75rem',
              letterSpacing: 0.5,
              fontWeight: 600,
            }}
          >
            Detalhes
          </Typography>

          <Stack spacing={2} sx={{ mb: 3 }}>
            <DetailRow
              icon="phone"
              label="Telefone / WhatsApp"
              value={displayed.clientPhone || 'Não informado'}
            />
            <DetailRow
              icon="calendar"
              label="Data"
              value={formatDayTitle(displayed.date)}
            />
            <DetailRow
              icon="clock"
              label="Horário"
              value={`${displayed.startTime} – ${displayed.endTime}`}
            />
            <DetailRow
              icon="user"
              label="Profissional"
              value={displayed.professionalName || 'Não informado'}
            />
            <DetailRow
              icon="tag"
              label="Serviço"
              value={displayed.serviceName || 'Não informado'}
            />
            <DetailRow
              icon="wallet"
              label="Valor"
              value={formatCurrencyBRL(displayed.totalPrice)}
            />
            {displayed.clientNotes ? (
              <DetailRow
                icon="document"
                label="Observações"
                value={displayed.clientNotes}
              />
            ) : null}
          </Stack>

          {canOpenWhatsApp ? (
            <Button
              variant="outlined"
              color="primary"
              fullWidth
              startIcon={<Icon name="phone" size={18} />}
              onClick={() => {
                window.open(
                  `https://wa.me/55${whatsappDigits}`,
                  '_blank',
                  'noopener,noreferrer',
                );
              }}
            >
              Conversar no WhatsApp
            </Button>
          ) : null}
        </Box>
      </Drawer>

      <ConfirmationDialog
        open={cancelOpen}
        title="Cancelar agendamento?"
        description={`O atendimento de ${displayed.clientName} em ${formatDayTitle(displayed.date)} às ${displayed.startTime} será marcado como cancelado.`}
        confirmLabel="Sim, cancelar"
        cancelLabel="Voltar"
        confirmColor="error"
        loading={updateStatusMutation.isPending}
        onCancel={() => {
          if (updateStatusMutation.isPending) return;
          setCancelOpen(false);
        }}
        onConfirm={handleConfirmCancel}
      />
    </>
  );
}
