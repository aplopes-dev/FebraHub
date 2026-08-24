'use client';

import type { ReactNode, SyntheticEvent } from 'react';
import { useMemo, useState } from 'react';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import type { SelectChangeEvent } from '@mui/material/Select';
import {
  Avatar,
  Box,
  Input,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@citybox/mui/atoms';
import { Autocomplete, DatePicker, TimePicker, toast } from '@citybox/mui/molecules';
import {
  Modal,
  ModalActions,
  ModalCancelButton,
  ModalConfirmButton,
  ModalContent,
  ModalScrollBody,
  ModalTitle,
  modalAutocompleteFieldSx,
  modalFieldLabelSx,
  modalFieldRootSx,
  modalPickerFieldSx,
  modalSectionTitleSx,
  modalSelectFieldSx,
  modalTimeFieldSx,
} from '@/components/ui/modal';
import type { ContactLeadDetail } from '@/features/leads/types';
import { useLeadsQuery } from '@/features/leads/hooks/use-leads-queries';
import { useCurrentAgentId } from '@/features/shared/session/hooks/use-current-agent-id';
import {
  isoDateToLocalDate,
  localDateToIsoDate,
} from '@/features/shared/utils/calendar';
import { SCROLL_CLASS } from '@/lib/scroll';
import { listifyElevatedSurface } from '@/theme/listify-field-styles';
import { listifyShadows } from '@/theme/tokens';
import { useDebouncedValue } from '../hooks/use-debounced-value';
import {
  useCreateAppointmentMutation,
  useUpdateAppointmentMutation,
} from '../hooks/use-calendar-queries';
import {
  APPOINTMENT_KIND_LABEL,
  type AppointmentKind,
  type CalendarAppointment,
} from '../types';
import { LeadPickerPreview } from './lead-picker-preview';

/** Mesma fonte do módulo Leads (`listLeads`); página de sugestões do autocomplete. */
const LEAD_PICKER_PER_PAGE = 20;

const APPOINTMENT_KINDS = Object.keys(APPOINTMENT_KIND_LABEL) as AppointmentKind[];

const AVATAR_PALETTE_KEYS = ['primary', 'success', 'info', 'warning'] as const;

type ScheduleFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  initial?: CalendarAppointment | null;
  defaultDate?: string;
  defaultStartHour?: number;
};

type FormState = {
  title: string;
  dateIso: string;
  startTime: string;
  endTime: string;
  location: string;
  kind: AppointmentKind;
  leadId: string;
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  leadPhotoUrl: string;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1]?.[0] ?? ''}`.toUpperCase();
}

function hourToTime(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

function toFormState(
  initial: CalendarAppointment | null | undefined,
  defaultDate?: string,
  defaultStartHour?: number,
): FormState {
  if (initial) {
    return {
      title: initial.title,
      dateIso: initial.date,
      startTime: initial.startTime,
      endTime: initial.endTime,
      location: initial.location,
      kind: initial.kind,
      leadId: initial.leadId ?? '',
      leadName: initial.leadName ?? '',
      leadEmail: initial.leadEmail ?? '',
      leadPhone: initial.leadPhone ?? '',
      leadPhotoUrl: initial.leadPhotoUrl ?? '',
    };
  }
  const start = defaultStartHour ?? 9;
  return {
    title: '',
    dateIso: defaultDate ?? '',
    startTime: hourToTime(start),
    endTime: hourToTime(Math.min(start + 1, 18)),
    location: '',
    kind: 'visit',
    leadId: '',
    leadName: '',
    leadEmail: '',
    leadPhone: '',
    leadPhotoUrl: '',
  };
}

type ScheduleFormBodyProps = {
  mode: 'create' | 'edit';
  initial?: CalendarAppointment | null;
  defaultDate?: string;
  defaultStartHour?: number;
  onOpenChange: (open: boolean) => void;
};

function FieldIcon({ children }: { children: ReactNode }) {
  return (
    <InputAdornment position="start" sx={{ mr: 1.25, ml: 0 }}>
      <Box sx={{ display: 'flex', color: 'text.secondary', '& > *': { fontSize: 20 } }}>
        {children}
      </Box>
    </InputAdornment>
  );
}

function ScheduleFormBody({
  mode,
  initial,
  defaultDate,
  defaultStartHour,
  onOpenChange,
}: ScheduleFormBodyProps) {
  const agentId = useCurrentAgentId();
  const createMutation = useCreateAppointmentMutation();
  const updateMutation = useUpdateAppointmentMutation();
  const [form, setForm] = useState<FormState>(() =>
    toFormState(initial, defaultDate, defaultStartHour),
  );
  const [pickedLead, setPickedLead] = useState<ContactLeadDetail | null>(() => {
    if (!initial?.leadId) return null;
    return {
      id: initial.leadId,
      name: initial.leadName ?? '',
      email: initial.leadEmail ?? '',
      phone: initial.leadPhone ?? '',
      photoUrl: initial.leadPhotoUrl ?? undefined,
      initials: initials(initial.leadName ?? ''),
    } as ContactLeadDetail;
  });
  const [leadSearch, setLeadSearch] = useState(() => initial?.leadName ?? '');
  const debouncedLeadSearch = useDebouncedValue(leadSearch, 400);
  const { data: leadsResult, isFetching: leadsLoading, isError: leadsError } =
    useLeadsQuery(
      {
        search: debouncedLeadSearch,
        page: 1,
        perPage: LEAD_PICKER_PER_PAGE,
        ...(agentId ? { agentId } : {}),
      },
      Boolean(agentId),
    );
  const leads = leadsResult?.data ?? [];
  const leadOptions = useMemo(() => {
    if (!pickedLead) return leads;
    if (leads.some((lead) => lead.id === pickedLead.id)) return leads;
    return [pickedLead, ...leads].slice(0, LEAD_PICKER_PER_PAGE);
  }, [leads, pickedLead]);
  const saving = createMutation.isPending || updateMutation.isPending;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function selectLead(lead: ContactLeadDetail | null) {
    setPickedLead(lead);
    // `inputValue` é controlado: sem isso a seleção não “gruda” no campo.
    setLeadSearch(lead?.name ?? '');
    if (!lead) {
      setForm((current) => ({
        ...current,
        leadId: '',
        leadName: '',
        leadEmail: '',
        leadPhone: '',
        leadPhotoUrl: '',
      }));
      return;
    }
    setForm((current) => ({
      ...current,
      leadId: lead.id,
      leadName: lead.name,
      leadEmail: lead.email ?? '',
      leadPhone: lead.phone ?? '',
      leadPhotoUrl: lead.photoUrl ?? '',
      title: current.title || lead.name,
    }));
  }

  function handleLeadInputChange(
    _event: SyntheticEvent,
    value: string,
    reason: string,
  ) {
    // Com input controlado, `selectOption`/`reset` também precisam refletir o label.
    // Só ignoramos `reset` vazio (blur sem valor) para não apagar busca em andamento.
    if (reason === 'reset' && !value.trim()) return;
    setLeadSearch(value);
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast.error('Informe o título do compromisso.');
      return;
    }
    if (!form.dateIso) {
      toast.error('Informe a data do compromisso.');
      return;
    }
    if (!form.startTime || !form.endTime) {
      toast.error('Informe o horário de início e fim.');
      return;
    }
    const resolvedAgentId = initial?.agentId?.trim() || agentId;
    if (!resolvedAgentId) {
      toast.error('Aguarde a identificação do corretor para salvar o compromisso.');
      return;
    }

    const payload = {
      title: form.title,
      date: form.dateIso,
      startTime: form.startTime,
      endTime: form.endTime,
      location: form.location,
      kind: form.kind,
      agentId: resolvedAgentId,
      leadId: form.leadId || undefined,
      leadName: form.leadName || undefined,
      leadEmail: form.leadEmail || undefined,
      leadPhone: form.leadPhone || undefined,
      leadPhotoUrl: form.leadPhotoUrl || undefined,
      done: initial?.done ?? false,
    };

    try {
      if (mode === 'create') {
        await createMutation.mutateAsync(payload);
        toast.success('Compromisso criado');
      } else if (initial) {
        const updated = await updateMutation.mutateAsync({
          id: initial.id,
          input: payload,
        });
        if (!updated) {
          toast.error('Não foi possível salvar o compromisso.');
          return;
        }
        toast.success('Compromisso atualizado');
      }
      onOpenChange(false);
    } catch {
      toast.error('Não foi possível salvar o compromisso.');
    }
  }

  return (
    <>
      <ModalTitle>
        {mode === 'create' ? 'Adicionar compromisso' : 'Editar compromisso'}
      </ModalTitle>

      <ModalContent sx={{ pt: 0, gap: 1.5, minWidth: 0, maxWidth: '100%' }}>
        <Input
          id="apt-title"
          value={form.title}
          onChange={(event) => update('title', event.target.value)}
          placeholder="Título do evento"
          slotProps={{
            htmlInput: { 'aria-label': 'Título do evento' },
          }}
          sx={modalFieldRootSx}
        />

        <Select
          value={form.kind}
          onChange={(event) =>
            update(
              'kind',
              (event as SelectChangeEvent<AppointmentKind>).target.value,
            )
          }
          displayEmpty
          slotProps={{
            input: { 'aria-label': 'Tipo do compromisso' },
          }}
          sx={modalSelectFieldSx}
        >
          {APPOINTMENT_KINDS.map((kind) => (
            <MenuItem key={kind} value={kind}>
              {APPOINTMENT_KIND_LABEL[kind]}
            </MenuItem>
          ))}
        </Select>

        <DatePicker
          id="apt-date"
          label=""
          placeholder="Data"
          value={isoDateToLocalDate(form.dateIso)}
          onChange={(date) => update('dateIso', localDateToIsoDate(date))}
          sx={modalPickerFieldSx}
        />

        <Box
          sx={{
            display: 'grid',
            // Mobile: empilha — evita overflow horizontal dos TimePickers.
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 1.25,
            minWidth: 0,
            width: '100%',
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={modalFieldLabelSx}>Início</Typography>
            <TimePicker
              id="apt-start"
              label=""
              value={form.startTime}
              onChange={(time) => update('startTime', time ?? '')}
              sx={modalTimeFieldSx}
            />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={modalFieldLabelSx}>Fim</Typography>
            <TimePicker
              id="apt-end"
              label=""
              value={form.endTime}
              onChange={(time) => update('endTime', time ?? '')}
              sx={modalTimeFieldSx}
            />
          </Box>
        </Box>

        <Input
          id="apt-location"
          value={form.location}
          onChange={(event) => update('location', event.target.value)}
          placeholder="Local"
          slotProps={{
            htmlInput: { 'aria-label': 'Local' },
            input: {
              startAdornment: (
                <FieldIcon>
                  <LocationOnOutlinedIcon />
                </FieldIcon>
              ),
            },
          }}
          sx={modalFieldRootSx}
        />

        <Stack spacing={1.25} sx={{ pt: 0.5 }}>
          <Typography sx={modalSectionTitleSx}>
            Escolher lead
          </Typography>

          <Autocomplete<ContactLeadDetail>
            options={leadOptions}
            value={pickedLead}
            loading={leadsLoading}
            filterOptions={(options) => options}
            getOptionLabel={(option) => option.name}
            getOptionKey={(option) => option.id}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            inputValue={leadSearch}
            onInputChange={handleLeadInputChange}
            onChange={(_event, lead) => selectLead(lead)}
            noOptionsText={
              leadsError
                ? 'Não foi possível carregar leads'
                : debouncedLeadSearch
                  ? 'Nenhum lead encontrado'
                  : 'Nenhum lead no módulo Leads'
            }
            openOnFocus
            clearOnBlur={false}
            slotProps={{
              listbox: { className: SCROLL_CLASS },
              paper: {
                sx: (theme) => ({
                  borderRadius: '16px',
                  bgcolor: listifyElevatedSurface(theme),
                  boxShadow:
                    theme.palette.mode === 'dark'
                      ? listifyShadows.md
                      : '0px 2px 8.2px 0px #32323226',
                  mt: 1,
                }),
              },
            }}
            renderOption={(props, lead, { index }) => {
              const { key: _muiKey, ...optionProps } = props;
              const paletteKey =
                AVATAR_PALETTE_KEYS[index % AVATAR_PALETTE_KEYS.length];
              return (
                <Box
                  component="li"
                  key={lead.id}
                  {...optionProps}
                  sx={{
                    display: 'flex !important',
                    alignItems: 'center',
                    gap: 1.5,
                    px: '12px !important',
                    py: '10px !important',
                  }}
                >
                  <Avatar
                    src={lead.photoUrl ?? undefined}
                    alt={lead.name}
                    sx={(theme) => {
                      const tone = theme.palette[paletteKey];
                      return {
                        width: 40,
                        height: 40,
                        bgcolor: tone.light,
                        color: tone.dark ?? tone.main,
                        fontSize: 13,
                        fontWeight: 600,
                      };
                    }}
                  >
                    {lead.initials || initials(lead.name)}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      noWrap
                      sx={{
                        fontSize: 15,
                        fontWeight: 700,
                        lineHeight: 1.35,
                        color: 'text.primary',
                      }}
                    >
                      {lead.name}
                    </Typography>
                    <Typography
                      noWrap
                      sx={{
                        fontSize: 13,
                        fontWeight: 400,
                        lineHeight: 1.4,
                        color: 'text.secondary',
                      }}
                    >
                      {lead.email || 'Sem e-mail'}
                    </Typography>
                  </Box>
                </Box>
              );
            }}
            renderInput={(params) => (
              <Input
                {...params}
                placeholder="Buscar lead…"
                slotProps={{
                  ...params.slotProps,
                  htmlInput: {
                    ...params.slotProps.htmlInput,
                    'aria-label': 'Buscar lead',
                  },
                  input: {
                    ...params.slotProps.input,
                    startAdornment: (
                      <>
                        <FieldIcon>
                          <SearchIcon />
                        </FieldIcon>
                        {params.slotProps.input.startAdornment}
                      </>
                    ),
                  },
                }}
                sx={modalAutocompleteFieldSx}
              />
            )}
          />

          {pickedLead ? (
            <LeadPickerPreview
              lead={{
                id: pickedLead.id,
                name: pickedLead.name,
                email: pickedLead.email,
                phone: pickedLead.phone ?? form.leadPhone,
                photoUrl: pickedLead.photoUrl ?? form.leadPhotoUrl,
                initials: pickedLead.initials || initials(pickedLead.name),
              }}
            />
          ) : null}
        </Stack>
      </ModalContent>

      <ModalActions sx={{ gap: 1.5, minWidth: 0 }}>
        <ModalCancelButton
          type="button"
          onClick={() => onOpenChange(false)}
          disabled={saving}
        >
          Cancelar
        </ModalCancelButton>
        <ModalConfirmButton
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          sx={{ flex: { xs: '1 1 auto', sm: 1.2 } }}
        >
          {mode === 'create' ? 'Salvar compromisso' : 'Salvar alterações'}
        </ModalConfirmButton>
      </ModalActions>
    </>
  );
}

export function ScheduleFormDialog({
  open,
  onOpenChange,
  mode,
  initial,
  defaultDate,
  defaultStartHour,
}: ScheduleFormDialogProps) {
  const formKey = `${mode}-${initial?.id ?? 'new'}-${defaultDate ?? ''}-${defaultStartHour ?? ''}`;

  return (
    <Modal open={open} onClose={() => onOpenChange(false)} maxWidth="sm">
      <ModalScrollBody>
        {open ? (
          <ScheduleFormBody
            key={formKey}
            mode={mode}
            initial={initial}
            defaultDate={defaultDate}
            defaultStartHour={defaultStartHour}
            onOpenChange={onOpenChange}
          />
        ) : null}
      </ModalScrollBody>
    </Modal>
  );
}
