'use client';

import { Box, Checkbox, Stack, Typography } from '@citybox/mui/atoms';
import { useTheme } from '@mui/material/styles';
import { ListifyPagination } from '@/components/ui/listify-pagination';
import { useClientListPagination } from '@/features/shared/hooks/use-client-list-pagination';
import { listifyElevatedSurface } from '@/theme/listify-field-styles';
import { listifyWarning } from '@/theme/tokens';
import type { CalendarAppointment, ScheduleListFilter } from '../types';
import { SCHEDULE_FILTER_LABEL } from '../types';
import { APPOINTMENT_CARD_SHADOW, getAppointmentKindSurface } from '../utils/appointment-kind-styles';
import { AppointmentPopover } from './appointment-hover-card';

const FILTERS: readonly ScheduleListFilter[] = ['all', 'assigned', 'mine'];

const FILTER_SHORT_LABEL: Record<ScheduleListFilter, string> = {
  all: 'Todos',
  assigned: 'Outros',
  mine: 'Meus',
};

function listItemTitle(appointment: CalendarAppointment): string {
  return appointment.leadName ?? appointment.title;
}

function listItemSubtitle(appointment: CalendarAppointment): string {
  if (appointment.location) return appointment.location;
  if (appointment.leadEmail) return appointment.leadEmail;
  return '—';
}

type CalendarTaskListProps = {
  filter: ScheduleListFilter;
  onFilterChange: (filter: ScheduleListFilter) => void;
  appointments: readonly CalendarAppointment[];
  onToggleDone: (appointment: CalendarAppointment) => void;
  onEdit: (appointment: CalendarAppointment) => void;
};

export function CalendarTaskList({
  filter,
  onFilterChange,
  appointments,
  onToggleDone,
  onEdit,
}: CalendarTaskListProps) {
  const theme = useTheme();
  const surface = getAppointmentKindSurface(theme);
  const pagination = useClientListPagination(appointments, filter);

  return (
    <Stack spacing={1.5} sx={{ minWidth: 0, width: '100%' }}>
      <Stack
        direction="row"
        role="tablist"
        aria-label="Filtro da agenda"
        sx={(theme) => ({
          alignItems: 'stretch',
          borderRadius: '10px',
          bgcolor: listifyElevatedSurface(theme),
          p: 0.5,
          gap: 0.5,
          minWidth: 0,
          width: '100%',
        })}
      >
        {FILTERS.map((value) => {
          const selected = filter === value;
          return (
            <Box
              key={value}
              component="button"
              type="button"
              role="tab"
              aria-selected={selected}
              aria-label={SCHEDULE_FILTER_LABEL[value]}
              onClick={() => onFilterChange(value)}
              sx={{
                position: 'relative',
                flex: 1,
                minWidth: 0,
                border: 0,
                bgcolor: 'transparent',
                cursor: 'pointer',
                px: { xs: 0.75, sm: 1.5 },
                py: { xs: 1, sm: 1.25 },
                borderRadius: '8px',
                fontFamily: 'inherit',
                fontWeight: 500,
                fontSize: { xs: 11, sm: 12 },
                lineHeight: 1.35,
                color: selected ? 'text.primary' : 'text.secondary',
                transition: 'color 0.15s',
                '&:hover': { color: 'text.primary' },
              }}
            >
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                {FILTER_SHORT_LABEL[value]}
              </Box>
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                {SCHEDULE_FILTER_LABEL[value]}
              </Box>
              {selected ? (
                <Box
                  component="span"
                  sx={{
                    position: 'absolute',
                    left: '50%',
                    bottom: 4,
                    width: 20,
                    height: 2,
                    borderRadius: 999,
                    bgcolor: listifyWarning[50],
                    transform: 'translateX(-50%)',
                  }}
                />
              ) : null}
            </Box>
          );
        })}
      </Stack>

      <Stack component="ul" spacing={1.25} sx={{ listStyle: 'none', m: 0, p: 0, minWidth: 0 }}>
        {pagination.pageItems.map((appointment) => {
          return (
            <Box component="li" key={appointment.id} sx={{ minWidth: 0 }}>
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  alignItems: 'center',
                  borderRadius: '12px',
                  bgcolor: surface.bg,
                  border: '1px solid',
                  borderColor: surface.border,
                  boxShadow: APPOINTMENT_CARD_SHADOW,
                  py: 1.25,
                  pr: 1.25,
                  pl: 1,
                  minWidth: 0,
                }}
              >
                <Checkbox
                  checked={appointment.done}
                  onChange={() => onToggleDone(appointment)}
                  slotProps={{
                    input: {
                      'aria-label': `Marcar ${listItemTitle(appointment)}`,
                    },
                  }}
                  size="small"
                  sx={{ p: 0.25, flexShrink: 0 }}
                  onClick={(event) => event.stopPropagation()}
                />
                <AppointmentPopover
                  appointment={appointment}
                  onEdit={onEdit}
                  side="right"
                >
                  <Box
                    component="button"
                    type="button"
                    sx={{
                      minWidth: 0,
                      flex: 1,
                      border: 0,
                      bgcolor: 'transparent',
                      cursor: 'pointer',
                      py: 0.25,
                      textAlign: 'left',
                    }}
                  >
                    <Typography
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: 14,
                        fontWeight: 500,
                        lineHeight: 1.55,
                        color: appointment.done
                          ? 'text.secondary'
                          : 'text.primary',
                        textDecoration: appointment.done
                          ? 'line-through'
                          : 'none',
                      }}
                    >
                      {listItemTitle(appointment)}
                    </Typography>
                    <Typography
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: 12,
                        fontWeight: 300,
                        lineHeight: 1.55,
                        color: 'text.secondary',
                      }}
                    >
                      {listItemSubtitle(appointment)}
                    </Typography>
                  </Box>
                </AppointmentPopover>
              </Stack>
            </Box>
          );
        })}

        {appointments.length === 0 ? (
          <Box
            component="li"
            sx={{
              borderRadius: '12px',
              bgcolor: 'secondary.main',
              px: 2,
              py: 2.5,
              textAlign: 'center',
            }}
          >
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
              Nenhum compromisso para o dia selecionado.
            </Typography>
          </Box>
        ) : null}
      </Stack>
      <ListifyPagination
        count={pagination.total}
        page={pagination.page}
        perPage={pagination.perPage}
        onPageChange={pagination.setPage}
        onPerPageChange={pagination.setPerPage}
        rowsPerPageOptions={pagination.perPageOptions}
      />
    </Stack>
  );
}
