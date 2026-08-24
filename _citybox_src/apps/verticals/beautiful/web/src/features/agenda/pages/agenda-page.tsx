'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Box, Card, Typography, Button } from '@citybox/mui/atoms';
import { toast } from '@citybox/mui/molecules';
import { Icon } from '@citybox/mui/icons';
import { useCan } from '@/features/permissions';
import { useClientsQuery } from '@/features/clients/hooks/use-clients-queries';
import { useAgendaProfessionalsQuery } from '@/features/members/hooks/use-members-queries';
import { useServicesQuery } from '@/features/catalog/hooks/use-catalog-queries';
import type {
  AgendaAppointment,
  AgendaProfessional,
  AgendaViewMode,
  AppointmentFormData,
} from '../types/agenda.types';
import {
  addDays,
  addMonths,
  getAgendaDateRange,
  pad2,
  todayIso,
} from '../utils/agenda-date';
import { useAppointmentCategoriesQuery } from '@/features/settings/hooks/use-appointment-categories-queries';
import { colorForProfessionalId } from '../utils/agenda-professional-color';
import {
  useAppointmentsQuery,
  useCreateAppointmentMutation,
  useUpdateAppointmentMutation,
} from '../hooks/use-appointments-queries';
import {
  AgendaToolbar,
  AGENDA_ALL_PROFESSIONALS,
} from '../components/agenda-toolbar';
import { AppointmentDetailsDrawer } from '../components/appointment-details-drawer';
import { AppointmentFormDrawer } from '../components/appointment-form-drawer';
import type { AppointmentFormMode } from '../components/appointment-form-drawer';
import { DayAgendaGrid } from '../components/day-agenda-grid';
import { MonthAgendaGrid } from '../components/month-agenda-grid';
import { WeekAgendaGrid } from '../components/week-agenda-grid';

export function AgendaPage() {
  const canCreateAppointment =
    useCan('create', 'Schedule') || useCan('update', 'Schedule');
  const canUpdateAppointment = useCan('update', 'Schedule') || canCreateAppointment;

  const [viewMode, setViewMode] = useState<AgendaViewMode>('week');
  const [cursorDate, setCursorDate] = useState(todayIso);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState(
    AGENDA_ALL_PROFESSIONALS,
  );
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<AppointmentFormMode>('create');
  const [formInitial, setFormInitial] = useState<Partial<AppointmentFormData> | null>(
    null,
  );
  const [editingAppointment, setEditingAppointment] =
    useState<AgendaAppointment | null>(null);
  const [detailsAppointment, setDetailsAppointment] =
    useState<AgendaAppointment | null>(null);

  const range = useMemo(
    () => getAgendaDateRange(viewMode, cursorDate),
    [viewMode, cursorDate],
  );

  const appointmentsQueryParams = useMemo(
    () => ({
      from: range.from,
      to: range.to,
      ...(selectedProfessionalId !== AGENDA_ALL_PROFESSIONALS
        ? { professionalId: selectedProfessionalId }
        : {}),
    }),
    [range.from, range.to, selectedProfessionalId],
  );

  const {
    data: membersRaw = [],
    isPending: loadingProfessionals,
    isError: professionalsError,
  } = useAgendaProfessionalsQuery({ status: 'active' });
  const { data: clientsPage, isPending: loadingClients } = useClientsQuery({
    perPage: 100,
  });
  const clientsRaw = clientsPage?.data ?? [];
  const { data: servicesPage, isPending: loadingServices } = useServicesQuery({
    active: true,
    perPage: 100,
  });
  const servicesRaw = servicesPage?.data ?? [];
  const { data: appointmentCategoriesRaw = [] } = useAppointmentCategoriesQuery();
  const {
    data: appointments = [],
    isPending: loadingAppointments,
    isError: appointmentsError,
  } = useAppointmentsQuery(appointmentsQueryParams);

  const createMutation = useCreateAppointmentMutation();
  const updateMutation = useUpdateAppointmentMutation();
  const formBusy = createMutation.isPending || updateMutation.isPending;

  /** Colunas/filtro/form: membros com `role=profissional` (`Member.id`). */
  const agendaProfessionals: AgendaProfessional[] = useMemo(
    () =>
      membersRaw.map((m) => ({
        id: m.id,
        name: m.name || `${m.firstName} ${m.lastName}`.trim(),
        active: m.status === 'active',
        color: colorForProfessionalId(m.id),
        serviceIds: m.serviceIds,
      })),
    [membersRaw],
  );

  const activeProfessionals = useMemo(
    () => agendaProfessionals.filter((p) => p.active),
    [agendaProfessionals],
  );

  /** Colunas da vista dia — UI apenas; dados já vêm filtrados pela API. */
  const visibleProfessionals = useMemo(() => {
    if (selectedProfessionalId === AGENDA_ALL_PROFESSIONALS) {
      return activeProfessionals;
    }
    return activeProfessionals.filter((p) => p.id === selectedProfessionalId);
  }, [activeProfessionals, selectedProfessionalId]);

  const agendaClients = useMemo(
    () =>
      clientsRaw.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
      })),
    [clientsRaw],
  );

  const agendaServices = useMemo(
    () =>
      servicesRaw.map((s) => ({
        id: s.id,
        name: s.name,
        durationMinutes: s.durationMinutes,
        price: s.price,
      })),
    [servicesRaw],
  );

  const agendaCategories = useMemo(
    () =>
      appointmentCategoriesRaw.map((c) => ({
        id: c.id,
        name: c.name,
        color: c.color,
      })),
    [appointmentCategoriesRaw],
  );

  const handleNavigate = (direction: -1 | 1) => {
    if (viewMode === 'month') {
      setCursorDate((d) => addMonths(d, direction));
      return;
    }
    if (viewMode === 'week') {
      setCursorDate((d) => addDays(d, direction * 7));
      return;
    }
    setCursorDate((d) => addDays(d, direction));
  };

  const handleSelectDay = (date: string) => {
    setCursorDate(date);
    setViewMode('day');
  };

  const openCreateForm = (initial?: Partial<AppointmentFormData>) => {
    if (!canCreateAppointment) return;
    setFormMode('create');
    setEditingAppointment(null);
    setFormInitial(initial ?? null);
    setFormOpen(true);
  };

  const openEditForm = (appointment: AgendaAppointment) => {
    if (!canUpdateAppointment) return;
    setFormMode('edit');
    setEditingAppointment(appointment);
    setFormInitial({
      clientId: appointment.clientId,
      professionalId: appointment.professionalId,
      serviceId: appointment.serviceId,
      date: appointment.date,
      startTime: appointment.startTime,
      clientNotes: appointment.clientNotes ?? '',
      categoryId: appointment.categoryId ?? '',
      status: appointment.status,
    });
    setDetailsAppointment(null);
    setFormOpen(true);
  };

  const closeForm = (force = false) => {
    if (!force && formBusy) return;
    setFormOpen(false);
    setFormInitial(null);
    setEditingAppointment(null);
    setFormMode('create');
  };

  const handleCreate = (data: AppointmentFormData) => {
    createMutation.mutate(data, {
      onSuccess: (created) => {
        closeForm(true);
        setCursorDate(data.date);
        toast.success('Agendamento criado!', {
          description: `${created.clientName} · ${created.startTime} com ${created.professionalName}.`,
        });
      },
      onError: () => {
        toast.error('Não foi possível criar o agendamento', {
          description: 'Verifique os dados e tente novamente em instantes.',
        });
      },
    });
  };

  const handleUpdate = (data: AppointmentFormData) => {
    if (!editingAppointment) return;
    updateMutation.mutate(
      {
        id: editingAppointment.id,
        data: {
          date: data.date,
          startTime: data.startTime,
          professionalId: data.professionalId,
          serviceId: data.serviceId,
          clientNotes: data.clientNotes,
          categoryId: data.categoryId ?? null,
        },
      },
      {
        onSuccess: (updated) => {
          closeForm(true);
          setCursorDate(data.date);
          setDetailsAppointment(updated);
          toast.success('Agendamento atualizado!', {
            description: `${updated.clientName} · ${updated.date} às ${updated.startTime}.`,
          });
        },
        onError: () => {
          toast.error('Não foi possível salvar as alterações', {
            description:
              'O horário pode estar ocupado ou fora da grade do profissional.',
          });
        },
      },
    );
  };

  const loadingLookups =
    loadingProfessionals || loadingClients || loadingServices;
  const showCalendarLoading = loadingAppointments && !appointmentsError;
  const noProfessionals =
    !loadingProfessionals &&
    !professionalsError &&
    activeProfessionals.length === 0;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        minWidth: 0,
      }}
    >
      <Card
        elevation={0}
        sx={{
          mb: 2.5,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <AgendaToolbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          cursorDate={cursorDate}
          onCursorDateChange={setCursorDate}
          onNavigate={handleNavigate}
          onToday={() => setCursorDate(todayIso())}
          professionals={agendaProfessionals}
          selectedProfessionalId={selectedProfessionalId}
          onProfessionalChange={setSelectedProfessionalId}
          action={
            canCreateAppointment ? (
              <Button
                variant="contained"
                color="primary"
                size="small"
                startIcon={<Icon name="plus" size={18} />}
                onClick={() => openCreateForm({ date: cursorDate })}
                disabled={loadingLookups || noProfessionals}
                sx={{ whiteSpace: 'nowrap', minHeight: 40 }}
              >
                Novo agendamento
              </Button>
            ) : null
          }
        />
      </Card>

      {professionalsError ? (
        <Typography variant="body2" color="error.main" sx={{ mb: 1.5 }}>
          Não foi possível carregar os profissionais da agenda.
        </Typography>
      ) : noProfessionals ? (
        <Box
          sx={{
            mb: 2,
            p: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'action.hover',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 1.5,
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Cadastre membros com papel Profissional em Equipe para aparecerem na
            agenda.
          </Typography>
          <Button
            component={Link}
            href="/equipe"
            variant="outlined"
            size="small"
            startIcon={<Icon name="users" size={16} />}
          >
            Ir para Equipe
          </Button>
        </Box>
      ) : (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5 }}>
          {showCalendarLoading
            ? 'Carregando agendamentos…'
            : `${appointments.length} agendamento(s) no filtro atual`}
        </Typography>
      )}

      <Card
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: viewMode === 'day' ? 910 : 700,
          minHeight: viewMode === 'day' ? 910 : 700,
          maxHeight: viewMode === 'day' ? 910 : 700,
          flexShrink: 0,
        }}
      >
        {appointmentsError ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              py: 8,
              px: 2,
              textAlign: 'center',
            }}
          >
            <Icon
              name="close"
              size={48}
              sx={{ color: 'error.main', opacity: 0.7, mb: 1 }}
            />
            <Typography variant="h6" color="error.main" sx={{ fontWeight: 600 }}>
              Não foi possível carregar a agenda
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Ocorreu uma indisponibilidade temporária. Tente novamente em
              instantes.
            </Typography>
          </Box>
        ) : showCalendarLoading ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              py: 10,
            }}
          >
            <Typography color="text.secondary">Carregando agenda…</Typography>
          </Box>
        ) : viewMode === 'month' ? (
          <MonthAgendaGrid
            cursorDate={cursorDate}
            appointments={appointments}
            onSelectDay={handleSelectDay}
            onSelectAppointment={setDetailsAppointment}
          />
        ) : viewMode === 'week' ? (
          <WeekAgendaGrid
            cursorDate={cursorDate}
            appointments={appointments}
            onSelectDay={handleSelectDay}
            onSelectAppointment={setDetailsAppointment}
          />
        ) : (
          <DayAgendaGrid
            date={cursorDate}
            appointments={appointments}
            professionals={visibleProfessionals}
            onSelectAppointment={setDetailsAppointment}
            onEmptySlotClick={(professionalId, hour) => {
              if (!canCreateAppointment) return;
              openCreateForm({
                date: cursorDate,
                professionalId,
                startTime: `${pad2(hour)}:00`,
              });
            }}
          />
        )}
      </Card>

      <AppointmentFormDrawer
        open={formOpen}
        mode={formMode}
        onClose={closeForm}
        onSubmit={formMode === 'edit' ? handleUpdate : handleCreate}
        isSubmitting={formBusy}
        professionals={agendaProfessionals}
        categories={agendaCategories}
        clients={agendaClients}
        services={agendaServices}
        initial={formInitial}
        editingAppointment={editingAppointment}
      />

      <AppointmentDetailsDrawer
        open={detailsAppointment !== null}
        appointment={detailsAppointment}
        onClose={() => setDetailsAppointment(null)}
        onAppointmentUpdated={setDetailsAppointment}
        onEdit={openEditForm}
      />
    </Box>
  );
}
