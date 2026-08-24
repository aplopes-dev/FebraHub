'use client';

import { useRef } from 'react';
import AddIcon from '@mui/icons-material/Add';
import { Button, Typography } from '@citybox/mui/atoms';
import { Drawer } from '@citybox/mui/molecules';
import { ListifyPagination } from '@/components/ui/listify-pagination';
import { useClientListPagination } from '@/features/shared/hooks/use-client-list-pagination';
import { MONTH_NAMES, WEEK_DAY_NAMES } from '@/features/shared/utils/calendar';
import type { CalendarAppointment } from '../types';
import { AppointmentEventCard } from './appointment-event-card';
import { AppointmentPopover } from './appointment-hover-card';
import { formatHourLabel } from './calendar-day-layout';

export type CalendarAppointmentsSheetState =
  | { open: false }
  | {
      open: true;
      date: string;
      slotHour?: number;
    };

function formatSheetTitle(date: string, slotHour?: number): string {
  const dateObj = new Date(`${date}T12:00:00`);
  const weekday = WEEK_DAY_NAMES[(dateObj.getDay() + 6) % 7];
  const day = dateObj.getDate();
  const month = MONTH_NAMES[dateObj.getMonth()];
  const dayLabel = `${weekday}, ${day} de ${month}`;
  if (slotHour == null) return dayLabel;
  return `${dayLabel} · ${formatHourLabel(slotHour)}`;
}

type CalendarAppointmentsSheetProps = {
  state: CalendarAppointmentsSheetState;
  appointments: readonly CalendarAppointment[];
  onOpenChange: (open: boolean) => void;
  onEdit: (appointment: CalendarAppointment) => void;
  onAdd?: (date: string, hour?: number) => void;
};

export function CalendarAppointmentsSheet({
  state,
  appointments,
  onOpenChange,
  onEdit,
  onAdd,
}: CalendarAppointmentsSheetProps) {
  const open = state.open;
  const slotHour = state.open ? state.slotHour : undefined;

  const title = state.open ? formatSheetTitle(state.date, slotHour) : '';
  const listRef = useRef<HTMLUListElement>(null);
  const pagination = useClientListPagination(
    appointments,
    state.open ? `${state.date}:${slotHour ?? ''}` : '',
  );
  const countLabel =
    pagination.total === 1 ? '1 compromisso' : `${pagination.total} compromissos`;

  function handleEdit(appointment: CalendarAppointment) {
    onOpenChange(false);
    onEdit(appointment);
  }

  return (
    <Drawer
      open={open}
      onClose={() => onOpenChange(false)}
      title={title}
      width={448}
      footer={
        onAdd && state.open ? (
          <Button
            type="button"
            variant="contained"
            fullWidth
            startIcon={<AddIcon fontSize="small" />}
            onClick={() => {
              onOpenChange(false);
              onAdd(state.date, slotHour);
            }}
          >
            Adicionar compromisso
          </Button>
        ) : undefined
      }
    >
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {countLabel}
      </Typography>

      {appointments.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {slotHour == null
            ? 'Nenhum compromisso neste dia.'
            : 'Nenhum compromisso neste horário.'}
        </Typography>
      ) : (
        <>
          <ul ref={listRef} className="flex flex-col gap-3">
            {pagination.pageItems.map((appointment) => (
              <li key={appointment.id}>
                <AppointmentPopover
                  appointment={appointment}
                  onEdit={handleEdit}
                  side="left"
                >
                  <button
                    type="button"
                    className="w-full rounded-2xl text-left transition-opacity hover:opacity-95"
                    style={{ minHeight: 88 }}
                  >
                    <AppointmentEventCard
                      appointment={appointment}
                      variant="card"
                      density="md"
                    />
                  </button>
                </AppointmentPopover>
              </li>
            ))}
          </ul>
          <ListifyPagination
            count={pagination.total}
            page={pagination.page}
            perPage={pagination.perPage}
            onPageChange={pagination.setPage}
            onPerPageChange={pagination.setPerPage}
            listRef={listRef}
          />
        </>
      )}
    </Drawer>
  );
}
