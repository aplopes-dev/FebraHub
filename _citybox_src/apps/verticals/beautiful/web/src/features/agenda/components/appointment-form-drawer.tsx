'use client';

import { useMemo, useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Drawer, FormField, DatePicker, TimePicker } from '@citybox/mui/molecules';
import { Icon } from '@citybox/mui/icons';
import { digitsOnly, formatPhoneBR } from '@/lib/field-masks';
import type {
  AgendaAppointment,
  AgendaCategoryOption,
  AgendaClientOption,
  AgendaProfessional,
  AgendaServiceOption,
  AppointmentClientMode,
  AppointmentFormData,
  AppointmentStatus,
} from '../types/agenda.types';
import { APPOINTMENT_STATUS_LABEL } from '../types/agenda.types';
import { addMinutesToTime, parseIsoDate, toIsoDate, todayIso } from '../utils/agenda-date';

export type AppointmentFormMode = 'create' | 'edit';

type AppointmentFormDrawerProps = {
  open: boolean;
  mode?: AppointmentFormMode;
  onClose: () => void;
  onSubmit: (data: AppointmentFormData) => void;
  professionals: AgendaProfessional[];
  categories: AgendaCategoryOption[];
  clients: AgendaClientOption[];
  services: AgendaServiceOption[];
  /** Prefill opcional (create: slot; edit: agendamento atual). */
  initial?: Partial<AppointmentFormData> | null;
  /** Cliente exibido no modo edição (somente leitura). */
  editingAppointment?: AgendaAppointment | null;
  isSubmitting?: boolean;
};

const DRAWER_WIDTH = 800;

const STATUS_OPTIONS = Object.entries(APPOINTMENT_STATUS_LABEL) as [
  AppointmentStatus,
  string,
][];

export function AppointmentFormDrawer({
  open,
  mode = 'create',
  onClose,
  onSubmit,
  professionals,
  categories,
  clients,
  services,
  initial = null,
  editingAppointment = null,
  isSubmitting = false,
}: AppointmentFormDrawerProps) {
  const isEdit = mode === 'edit';
  const activePros = useMemo(
    () => professionals.filter((p) => p.active),
    [professionals],
  );

  // Client selection state
  const [clientMode, setClientMode] = useState<AppointmentClientMode | null>(null);
  const [clientId, setClientId] = useState(initial?.clientId ?? '');
  const [newClientName, setNewClientName] = useState(
    initial?.newClient?.name ?? '',
  );
  const [newClientPhone, setNewClientPhone] = useState(
    initial?.newClient?.phone ?? '',
  );

  // Appointment form state
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '');
  const [professionalId, setProfessionalId] = useState(
    initial?.professionalId ?? activePros[0]?.id ?? '',
  );
  const [serviceId, setServiceId] = useState(initial?.serviceId ?? '');
  const [date, setDate] = useState(initial?.date ?? todayIso());
  const [startTime, setStartTime] = useState(initial?.startTime ?? '09:00');
  const [clientNotes, setClientNotes] = useState(initial?.clientNotes ?? '');
  const [status, setStatus] = useState<AppointmentStatus>(
    initial?.status ?? 'SCHEDULED',
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset state when drawer opens or dependencies change
  useEffect(() => {
    if (open) {
      const defaultMode: AppointmentClientMode | null =
        initial?.newClient
          ? 'new'
          : initial?.clientId
            ? 'existing'
            : clients.length === 0
              ? 'new'
              : 'existing';

      setClientMode(isEdit ? 'existing' : defaultMode);
      setClientId(initial?.clientId ?? '');
      setNewClientName(initial?.newClient?.name ?? '');
      setNewClientPhone(initial?.newClient?.phone ?? '');
      setCategoryId(initial?.categoryId ?? '');
      setProfessionalId(initial?.professionalId ?? activePros[0]?.id ?? '');
      setServiceId(initial?.serviceId ?? '');
      setDate(initial?.date ?? todayIso());
      setStartTime(initial?.startTime ?? '09:00');
      setClientNotes(initial?.clientNotes ?? '');
      setStatus(initial?.status ?? 'SCHEDULED');
      setErrors({});
    }
  }, [open, isEdit, initial, activePros, clients.length]);

  const selectedService = services.find((s) => s.id === serviceId);
  const endPreview = selectedService
    ? addMinutesToTime(startTime, selectedService.durationMinutes)
    : null;

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};

    if (!isEdit) {
      if (!clientMode) {
        next.clientMode = 'Selecione o tipo de cliente.';
      } else if (clientMode === 'existing') {
        if (!clientId) next.clientId = 'Selecione o cliente.';
      } else if (clientMode === 'new') {
        if (!newClientName.trim() || newClientName.trim().length < 2) {
          next.newClientName = 'Informe o nome do cliente (mínimo 2 caracteres).';
        }
        const phoneDigits = digitsOnly(newClientPhone);
        if (!phoneDigits) {
          next.newClientPhone = 'Informe o telefone/WhatsApp.';
        } else if (phoneDigits.length < 10) {
          next.newClientPhone = 'Informe um telefone válido com DDD (mínimo 10 dígitos).';
        }
      }
    }

    if (!professionalId) next.professionalId = 'Selecione o profissional.';
    if (!serviceId) next.serviceId = 'Selecione o serviço.';
    if (!date) next.date = 'Informe a data.';
    if (!startTime) next.startTime = 'Informe o horário.';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (isSubmitting) return;
    if (!validate()) return;

    const payload: AppointmentFormData = {
      professionalId,
      serviceId,
      date,
      startTime,
      categoryId: categoryId || null,
      clientNotes: clientNotes.trim(),
      status: isEdit ? (editingAppointment?.status ?? status) : status,
    };

    if (isEdit) {
      payload.clientId = editingAppointment?.clientId ?? initial?.clientId;
    } else if (clientMode === 'existing') {
      payload.clientId = clientId;
    } else {
      payload.newClient = {
        name: newClientName.trim(),
        phone: newClientPhone.trim(),
      };
    }

    onSubmit(payload);
  };

  const canSubmit =
    (isEdit || Boolean(clientMode)) &&
    Boolean(professionalId) &&
    Boolean(serviceId) &&
    Boolean(date) &&
    Boolean(startTime);

  const titleText = isEdit ? 'Editar agendamento' : 'Novo agendamento';
  const subtitleText = isEdit
    ? 'Atualize as informações do agendamento'
    : 'Selecione o tipo de cliente e preencha os dados do agendamento';

  const footerNode = (
    <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
      <Button variant="outlined" color="inherit" onClick={handleClose} disabled={isSubmitting}>
        Cancelar
      </Button>
      <Button
        variant="contained"
        onClick={handleSubmit}
        disabled={!canSubmit || isSubmitting}
        startIcon={
          isSubmitting ? <CircularProgress size={18} color="inherit" /> : undefined
        }
      >
        {isSubmitting
          ? isEdit
            ? 'Salvando…'
            : 'Agendando…'
          : isEdit
            ? 'Salvar alterações'
            : 'Agendar'}
      </Button>
    </Stack>
  );

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title={titleText}
      subtitle={subtitleText}
      footer={footerNode}
      width={DRAWER_WIDTH}
      anchor="right"
    >
      <Stack spacing={3}>
        {/* Seção do Cliente */}
        {isEdit ? (
          <Box
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              px: 2,
              py: 1.5,
              bgcolor: 'action.hover',
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Cliente
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {editingAppointment?.clientName ?? '—'}
            </Typography>
            {editingAppointment?.clientPhone ? (
              <Typography variant="caption" color="text.secondary">
                {editingAppointment.clientPhone}
              </Typography>
            ) : null}
          </Box>
        ) : (
          <Stack spacing={2.5}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <ButtonBase
                  onClick={() => {
                    setClientMode('existing');
                    setErrors((prev) => ({ ...prev, clientMode: '' }));
                  }}
                  sx={{
                    width: '100%',
                    p: 2.5,
                    borderRadius: 2.5,
                    border: '2px solid',
                    borderColor: clientMode === 'existing' ? 'primary.main' : 'divider',
                    bgcolor: clientMode === 'existing' ? 'action.selected' : 'background.paper',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: 1.5,
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      borderColor: clientMode === 'existing' ? 'primary.main' : 'action.active',
                      bgcolor: clientMode === 'existing' ? 'action.selected' : 'action.hover',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: clientMode === 'existing' ? 'primary.main' : 'action.hover',
                      color: clientMode === 'existing' ? 'primary.contrastText' : 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name="users" size={24} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.25 }}>
                      Cliente já cadastrado
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Selecione um cliente da base
                    </Typography>
                  </Box>
                </ButtonBase>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <ButtonBase
                  onClick={() => {
                    setClientMode('new');
                    setErrors((prev) => ({ ...prev, clientMode: '' }));
                  }}
                  sx={{
                    width: '100%',
                    p: 2.5,
                    borderRadius: 2.5,
                    border: '2px solid',
                    borderColor: clientMode === 'new' ? 'primary.main' : 'divider',
                    bgcolor: clientMode === 'new' ? 'action.selected' : 'background.paper',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: 1.5,
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      borderColor: clientMode === 'new' ? 'primary.main' : 'action.active',
                      bgcolor: clientMode === 'new' ? 'action.selected' : 'action.hover',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: clientMode === 'new' ? 'primary.main' : 'action.hover',
                      color: clientMode === 'new' ? 'primary.contrastText' : 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name="user" size={24} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.25 }}>
                      Novo cliente
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Cadastrar cliente na hora
                    </Typography>
                  </Box>
                </ButtonBase>
              </Grid>
            </Grid>

            {errors.clientMode ? (
              <Typography variant="caption" color="error">
                {errors.clientMode}
              </Typography>
            ) : null}

            {/* Campos específicos do cliente selecionado */}
            {clientMode === 'existing' ? (
              <FormControl fullWidth error={Boolean(errors.clientId)}>
                <InputLabel id="drawer-client-label">Cliente *</InputLabel>
                <Select
                  labelId="drawer-client-label"
                  label="Cliente *"
                  value={clientId}
                  onChange={(e) => {
                    setClientId(String(e.target.value));
                    if (errors.clientId) setErrors((prev) => ({ ...prev, clientId: '' }));
                  }}
                >
                  {clients.length === 0 ? (
                    <MenuItem disabled value="">
                      Nenhum cliente cadastrado
                    </MenuItem>
                  ) : (
                    clients.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name} · {c.phone}
                      </MenuItem>
                    ))
                  )}
                </Select>
                {errors.clientId ? (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors.clientId}
                  </Typography>
                ) : clients.length === 0 ? (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    Use &quot;Novo cliente&quot; para cadastrar na hora.
                  </Typography>
                ) : null}
              </FormControl>
            ) : null}

            {clientMode === 'new' ? (
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormField
                    label="Nome *"
                    placeholder="Ex: Maria Souza"
                    value={newClientName}
                    onChange={(e) => {
                      setNewClientName(e.target.value);
                      if (errors.newClientName) setErrors((prev) => ({ ...prev, newClientName: '' }));
                    }}
                    error={Boolean(errors.newClientName)}
                    helperText={errors.newClientName}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormField
                    label="Telefone / WhatsApp *"
                    placeholder="(73) 99999-9999"
                    value={newClientPhone}
                    onChange={(e) => {
                      setNewClientPhone(formatPhoneBR(e.target.value));
                      if (errors.newClientPhone) setErrors((prev) => ({ ...prev, newClientPhone: '' }));
                    }}
                    error={Boolean(errors.newClientPhone)}
                    helperText={errors.newClientPhone}
                    fullWidth
                  />
                </Grid>
              </Grid>
            ) : null}
          </Stack>
        )}

        {/* Renderiza todos os campos de agendamento se um modo de cliente estiver selecionado ou em edição */}
        {(isEdit || clientMode !== null) ? (
          <>
            <Divider />

            <Stack spacing={2.5}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                Dados do Agendamento
              </Typography>

              <FormControl fullWidth>
                <InputLabel id="drawer-category-label">Categoria (opcional)</InputLabel>
                <Select
                  labelId="drawer-category-label"
                  label="Categoria (opcional)"
                  value={categoryId}
                  onChange={(e) => setCategoryId(String(e.target.value))}
                >
                  <MenuItem value="">
                    <em>Sem categoria</em>
                  </MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth error={Boolean(errors.professionalId)}>
                    <InputLabel id="drawer-pro-label">Profissional *</InputLabel>
                    <Select
                      labelId="drawer-pro-label"
                      label="Profissional *"
                      value={professionalId}
                      onChange={(e) => {
                        setProfessionalId(String(e.target.value));
                        if (errors.professionalId) setErrors((prev) => ({ ...prev, professionalId: '' }));
                      }}
                    >
                      {activePros.map((p) => (
                        <MenuItem key={p.id} value={p.id}>
                          {p.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.professionalId ? (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {errors.professionalId}
                      </Typography>
                    ) : null}
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth error={Boolean(errors.serviceId)}>
                    <InputLabel id="drawer-svc-label">Serviço *</InputLabel>
                    <Select
                      labelId="drawer-svc-label"
                      label="Serviço *"
                      value={serviceId}
                      onChange={(e) => {
                        setServiceId(String(e.target.value));
                        if (errors.serviceId) setErrors((prev) => ({ ...prev, serviceId: '' }));
                      }}
                    >
                      {services.map((s) => (
                        <MenuItem key={s.id} value={s.id}>
                          {s.name} ({s.durationMinutes} min)
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.serviceId ? (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {errors.serviceId}
                      </Typography>
                    ) : null}
                  </FormControl>
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box>
                    <DatePicker
                      label="Data *"
                      value={parseIsoDate(date)}
                      onChange={(next) => {
                        if (next) {
                          setDate(toIsoDate(next));
                          if (errors.date) setErrors((prev) => ({ ...prev, date: '' }));
                        }
                      }}
                    />
                    {errors.date ? (
                      <Typography variant="caption" color="error">
                        {errors.date}
                      </Typography>
                    ) : null}
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box>
                    <TimePicker
                      label="Horário *"
                      value={startTime}
                      minutesStep={5}
                      onChange={(next) => {
                        setStartTime(next ?? startTime);
                        if (errors.startTime) setErrors((prev) => ({ ...prev, startTime: '' }));
                      }}
                    />
                    {endPreview ? (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        Término estimado: {endPreview}
                      </Typography>
                    ) : null}
                    {errors.startTime ? (
                      <Typography variant="caption" color="error">
                        {errors.startTime}
                      </Typography>
                    ) : null}
                  </Box>
                </Grid>
              </Grid>

              {!isEdit ? (
                <FormControl fullWidth>
                  <InputLabel id="drawer-status-label">Status</InputLabel>
                  <Select
                    labelId="drawer-status-label"
                    label="Status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
                  >
                    {STATUS_OPTIONS.map(([value, label]) => (
                      <MenuItem key={value} value={value}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : null}

              <FormField
                label="Observações do atendimento"
                placeholder="Ex.: procedimento desejado, preferências…"
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                fullWidth
                multiline
                minRows={2}
              />
            </Stack>
          </>
        ) : null}
      </Stack>
    </Drawer>
  );
}
