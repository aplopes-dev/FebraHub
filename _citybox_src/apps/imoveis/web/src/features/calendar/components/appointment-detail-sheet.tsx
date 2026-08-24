'use client';

import { type ReactNode } from 'react';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Stack,
  Typography,
} from '@citybox/mui/atoms';
import type { Theme } from '@mui/material/styles';
import { Drawer, toast } from '@citybox/mui/molecules';
import { modalDetailFieldSx } from '@/components/ui/modal';
import { MONTH_NAMES, WEEK_DAY_NAMES } from '@/features/shared/utils/calendar';
import {
  listifyRadii,
} from '@/theme/tokens';
import { useDeleteAppointmentMutation } from '../hooks/use-calendar-queries';
import { APPOINTMENT_KIND_LABEL, type CalendarAppointment } from '../types';
import { formatAppointmentTimeRange } from '../utils/format-appointment-time';

type AppointmentDetailSheetProps = {
  appointment: CalendarAppointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (appointment: CalendarAppointment) => void;
};

/** Mesma superfície dos campos do modal de compromisso. */
function resolveDetailFieldSx(
  theme: Theme,
  overrides?: Record<string, unknown>,
) {
  const base =
    typeof modalDetailFieldSx === 'function'
      ? modalDetailFieldSx(theme)
      : modalDetailFieldSx;
  return { ...base, ...overrides };
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1]?.[0] ?? ''}`.toUpperCase();
}

function formatSheetDate(date: string): string {
  const dateObj = new Date(`${date}T12:00:00`);
  const weekday = WEEK_DAY_NAMES[(dateObj.getDay() + 6) % 7];
  const month = MONTH_NAMES[dateObj.getMonth()];
  return `${weekday}, ${dateObj.getDate()} de ${month}`;
}

function FieldIcon({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'flex',
        color: 'text.secondary',
        flexShrink: 0,
        '& > *': { fontSize: 20 },
      }}
    >
      {children}
    </Box>
  );
}

function DetailBox({
  icon,
  label,
  children,
  multiline = false,
}: {
  icon?: ReactNode;
  label: string;
  children: ReactNode;
  multiline?: boolean;
}) {
  return (
    <Box
      sx={(theme) =>
        resolveDetailFieldSx(theme, {
          alignItems: multiline ? 'flex-start' : 'center',
          minHeight: multiline ? 72 : 52,
        })
      }
    >
      {icon ? <FieldIcon>{icon}</FieldIcon> : null}
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 500,
            lineHeight: 1.3,
            color: 'text.secondary',
            mb: 0.25,
          }}
        >
          {label}
        </Typography>
        <Box
          sx={{
            fontSize: 15,
            fontWeight: 500,
            lineHeight: 1.45,
            color: 'text.primary',
            wordBreak: 'break-word',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export function AppointmentDetailSheet({
  appointment,
  open,
  onOpenChange,
  onEdit,
}: AppointmentDetailSheetProps) {
  const deleteMutation = useDeleteAppointmentMutation();
  const name = appointment?.leadName ?? appointment?.title ?? '';
  const deleting = deleteMutation.isPending;

  function handleEdit() {
    if (!appointment) return;
    onOpenChange(false);
    onEdit(appointment);
  }

  async function handleDelete() {
    if (!appointment) return;
    try {
      await deleteMutation.mutateAsync(appointment.id);
      toast.success('Compromisso excluído');
      onOpenChange(false);
    } catch {
      toast.error('Não foi possível excluir o compromisso.');
    }
  }

  return (
    <Drawer
      open={open}
      onClose={() => onOpenChange(false)}
      title="Detalhes do compromisso"
      width={448}
      slotProps={{
        paper: {
          sx: {
            bgcolor: 'secondary.main',
          },
        },
      }}
      footer={
        <Stack direction="row" spacing={1.25} sx={{ width: '100%' }}>
          <Button
            type="button"
            variant="contained"
            onClick={handleEdit}
            disabled={!appointment || deleting}
            sx={{
              flex: 1,
              borderRadius: `${listifyRadii.lg}px`,
              textTransform: 'none',
            }}
          >
            Editar compromisso
          </Button>
          <Button
            type="button"
            color="error"
            variant="outlined"
            onClick={() => void handleDelete()}
            disabled={!appointment || deleting}
            sx={{
              flex: 1,
              borderRadius: `${listifyRadii.lg}px`,
              textTransform: 'none',
            }}
          >
            Excluir
          </Button>
        </Stack>
      }
    >
      {appointment ? (
        <Stack spacing={1.5}>
          <Box
            sx={(theme) =>
              resolveDetailFieldSx(theme, { py: 2, alignItems: 'flex-start' })
            }
          >
            <Avatar
              src={appointment.leadPhotoUrl ?? undefined}
              alt={name}
              sx={{
                width: 48,
                height: 48,
                flexShrink: 0,
                bgcolor: 'secondary.dark',
                color: 'text.primary',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {initials(name)}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                noWrap
                sx={{ fontSize: 15, fontWeight: 700, lineHeight: 1.35 }}
              >
                {name}
              </Typography>
              {appointment.leadName ? (
                <Typography
                  noWrap
                  sx={{
                    mt: 0.25,
                    fontSize: 13,
                    fontWeight: 400,
                    color: 'text.secondary',
                  }}
                >
                  {appointment.title}
                </Typography>
              ) : null}
              <Stack
                direction="row"
                spacing={0.75}
                sx={{ mt: 1, flexWrap: 'wrap' }}
              >
                <Badge
                  label={APPOINTMENT_KIND_LABEL[appointment.kind]}
                  size="small"
                  color="default"
                />
                <Badge
                  label={appointment.done ? 'Concluído' : 'Pendente'}
                  size="small"
                  variant={appointment.done ? 'filled' : 'outlined'}
                />
              </Stack>
            </Box>
          </Box>

          <DetailBox
            label="Data"
            icon={<CalendarMonthOutlinedIcon />}
          >
            {formatSheetDate(appointment.date)}
          </DetailBox>

          <DetailBox label="Horário" icon={<AccessTimeIcon />}>
            {formatAppointmentTimeRange(
              appointment.startTime,
              appointment.endTime,
            )}
          </DetailBox>

          <DetailBox
            label="Local"
            icon={<LocationOnOutlinedIcon />}
            multiline={Boolean(appointment.location)}
          >
            {appointment.location ? (
              appointment.location
            ) : (
              <Typography
                component="span"
                sx={{ fontSize: 15, fontWeight: 500, color: 'text.secondary' }}
              >
                —
              </Typography>
            )}
          </DetailBox>

          <DetailBox label="Descrição" multiline>
            {appointment.description ? (
              <Typography
                sx={{
                  fontSize: 15,
                  fontWeight: 500,
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.55,
                }}
              >
                {appointment.description}
              </Typography>
            ) : (
              <Typography
                component="span"
                sx={{ fontSize: 15, fontWeight: 500, color: 'text.secondary' }}
              >
                —
              </Typography>
            )}
          </DetailBox>

          {appointment.leadEmail ? (
            <DetailBox label="E-mail" icon={<EmailOutlinedIcon />}>
              <Typography noWrap sx={{ fontSize: 15, fontWeight: 500 }}>
                {appointment.leadEmail}
              </Typography>
            </DetailBox>
          ) : null}

          {appointment.leadPhone ? (
            <DetailBox label="Telefone" icon={<PhoneOutlinedIcon />}>
              {appointment.leadPhone}
            </DetailBox>
          ) : null}
        </Stack>
      ) : null}
    </Drawer>
  );
}
