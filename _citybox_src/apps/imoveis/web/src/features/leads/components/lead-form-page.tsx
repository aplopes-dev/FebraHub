'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import type { SxProps, Theme } from '@mui/material/styles';
import AttachMoneyOutlinedIcon from '@mui/icons-material/AttachMoneyOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import {
  Box,
  Button,
  FormControl,
  IconButton,
  Input,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@citybox/mui/atoms';
import { DatePicker, toast } from '@citybox/mui/molecules';
import {
  Modal,
  ModalActions,
  ModalCancelButton,
  ModalConfirmButton,
  ModalContent,
  ModalDescription,
  ModalScrollBody,
  ModalTitle,
} from '@/components/ui/modal';
import { ModuleBackLink } from '@/components/ui/module-back-link';
import { Panel } from '@/components/ui/panel';
import { getTeamAgentName } from '@/features/shared/constants/agents';
import { PROPERTY_TYPE_LABEL, type PropertyType } from '@/features/shared/types';
import {
  isoDateToLocalDate,
  localDateToIsoDate,
} from '@/features/shared/utils/calendar';
import {
  listifyError,
  listifyPrimary,
} from '@/theme/tokens';
import {
  listifyPageFieldSx,
  listifyPageSelectSx,
} from '@/theme/listify-field-styles';
import { EMPTY_LEAD } from '../data/mock-data';
import { useCreateLeadMutation, useDeleteLeadMutation, useLeadQuery, useUpdateLeadMutation } from '../hooks/use-leads-queries';
import type { LeadWriteInput } from '../services/leads-service';
import {
  LEAD_PAYMENT_INTENTS,
  LEAD_PAYMENT_INTENT_LABEL,
  LEAD_PURPOSE_LABEL,
  LEAD_SOURCE_LABEL,
  LEAD_STATUS_LABEL,
  type ContactLeadDetail,
  type LeadActivity,
  type LeadDocument,
  type LeadPaymentIntent,
  type LeadPurpose,
  type LeadSource,
  type LeadStatus,
  type MatchedProperty,
} from '../types';
import { useCurrentAgentId } from '@/features/shared/session/hooks/use-current-agent-id';
import { LeadAgentsField } from './lead-agents-field';
import { LeadActivityTab } from './lead-activity-tab';
import { LeadDocumentsTab } from './lead-documents-tab';
import { LeadFormSidebar } from './lead-form-sidebar';
import { LeadFormTabs, type LeadFormTabValue } from './lead-form-tabs';
import { leadTabMultilineSx } from './lead-form-tab-styles';
import { LeadPropertiesTab } from './lead-properties-tab';
import { CreateTransactionDialog } from '@/features/transactions/components/create-transaction-dialog';
import type { CreateTransactionPrefill } from '@/features/transactions/types';
import { buildTransactionPrefillFromLead } from '@/features/transactions/utils/build-prefill-from-lead';
import {
  formatPhoneBR,
  isoToDisplayDate,
  maskBudgetInput,
  normalizeBudgetDisplay,
} from '../utils/field-masks';
import { fileToProfileDataUrl } from '../utils/profile-photo';

type LeadFormPageProps = {
  mode: 'create' | 'edit';
  initialLead?: ContactLeadDetail | null;
  initialTab?: LeadFormTabValue;
  /**
   * Create mode: pré-preenche a partir de
   * `/leads/new?propertyId=&source=whatsapp&name=&phone=`.
   */
  createPrefill?: {
    matchedProperties?: readonly MatchedProperty[];
    interestedPropertyType?: PropertyType;
    name?: string;
    phone?: string;
    /** Ex.: `whatsapp` quando `source=whatsapp` na URL. */
    leadSource?: LeadSource;
    /** Vincula o corretor da sessão (TeamMember.agentId). */
    assignCurrentAgent?: boolean;
    /** Auto-foco no campo Nome ao abrir o formulário. */
    focusClientName?: boolean;
  };
};

type FormState = {
  name: string;
  email: string;
  phone: string;
  status: LeadStatus;
  leadSource: LeadSource;
  interestedPropertyType: PropertyType;
  budgetRange: string;
  preferredLocation: string;
  purpose: LeadPurpose;
  paymentIntent: LeadPaymentIntent | '';
  latestFollowUpIso: string;
  nextFollowUpIso: string;
  notes: string;
  photoUrl: string;
  agentIds: string[];
  matchedProperties: MatchedProperty[];
  documents: LeadDocument[];
  activities: LeadActivity[];
};

const FIELD_SX = listifyPageFieldSx;

/** Uma linha por seção: 4 campos iguais, inputs alinhados pela base. */
const FIELD_ROW_SX = {
  display: 'grid',
  gap: 1.5,
  alignItems: 'end',
  minWidth: 0,
  width: '100%',
  gridTemplateColumns: {
    xs: '1fr',
    sm: 'repeat(2, minmax(0, 1fr))',
    md: 'repeat(4, minmax(0, 1fr))',
  },
  '& > *': { minWidth: 0 },
} as const;

/** DatePicker alinhado aos campos do formulário de lead. */
const DATE_PICKER_SX: SxProps<Theme> = (theme) => ({
  width: '100%',
  minWidth: 0,
  maxWidth: '100%',
  '& .MuiPickersOutlinedInput-root': {
    borderRadius: '12px',
    minHeight: 48,
    minWidth: 0,
    width: '100%',
    bgcolor: theme.palette.secondary.light,
    fontSize: '1rem',
    '& fieldset': { borderColor: theme.palette.secondary.light },
    '&:hover fieldset': { borderColor: theme.palette.divider },
    '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
    '&.Mui-disabled': {
      bgcolor: theme.palette.secondary.main,
    },
  },
});

const SELECT_SX = listifyPageSelectSx;

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1]?.[0] ?? ''}`.toUpperCase();
}

function toFormState(lead: ContactLeadDetail): FormState {
  return {
    name: lead.name,
    email: lead.email ?? '',
    phone: formatPhoneBR(lead.phone ?? ''),
    status: lead.status,
    leadSource: lead.leadSource,
    interestedPropertyType: lead.interestedPropertyType,
    budgetRange: normalizeBudgetDisplay(lead.budgetRange),
    preferredLocation: lead.preferredLocation,
    purpose: lead.purpose,
    paymentIntent: lead.paymentIntents?.[0] ?? '',
    latestFollowUpIso: lead.latestFollowUp,
    nextFollowUpIso: lead.nextFollowUp,
    notes: lead.notes,
    photoUrl: lead.photoUrl ?? '',
    agentIds: [...(lead.agentIds ?? [])],
    matchedProperties: [...(lead.matchedProperties ?? [])],
    documents: [...(lead.documents ?? [])],
    activities: [...(lead.activities ?? [])],
  };
}

function appendActivity(
  activities: LeadActivity[],
  partial: Omit<LeadActivity, 'id' | 'createdAt'> & { createdAt?: string },
): LeadActivity[] {
  return [
    {
      id: `lact-${crypto.randomUUID()}`,
      createdAt: partial.createdAt ?? new Date().toISOString(),
      type: partial.type,
      message: partial.message,
      authorName: partial.authorName,
    },
    ...activities,
  ];
}

function sameIdSet(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((id) => setB.has(id));
}

function Field({
  label,
  htmlFor,
  children,
  sx,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  sx?: object;
}) {
  return (
    <Stack spacing={0.75} sx={{ minWidth: 0, maxWidth: '100%', ...sx }}>
      <Box
        component="label"
        htmlFor={htmlFor}
        title={label}
        sx={{
          fontSize: '0.875rem',
          fontWeight: 500,
          lineHeight: 1.55,
          minHeight: '1.55em',
          color: 'text.secondary',
          display: 'block',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </Box>
      {children}
    </Stack>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Typography
      component="h2"
      sx={{
        fontSize: '1.125rem',
        fontWeight: 500,
        letterSpacing: '-0.02em',
        lineHeight: 1.4,
        mb: 1.5,
      }}
    >
      {children}
    </Typography>
  );
}

export function LeadFormPage({
  mode,
  initialLead,
  initialTab,
  createPrefill,
}: LeadFormPageProps) {
  const router = useRouter();
  const currentAgentId = useCurrentAgentId();
  const seed = initialLead ?? EMPTY_LEAD;
  const [form, setForm] = useState<FormState>(() => {
    const base = toFormState(seed);
    if (mode !== 'create' || !createPrefill) return base;
    const prefillName = createPrefill.name?.trim();
    const prefillPhone = createPrefill.phone?.trim();
    return {
      ...base,
      name: prefillName || base.name,
      phone: prefillPhone ? formatPhoneBR(prefillPhone) : base.phone,
      leadSource: createPrefill.leadSource ?? base.leadSource,
      interestedPropertyType:
        createPrefill.interestedPropertyType ?? base.interestedPropertyType,
      matchedProperties: createPrefill.matchedProperties
        ? [...createPrefill.matchedProperties]
        : base.matchedProperties,
    };
  });

  /** Atribui o corretor da sessão assim que o StoreProvider resolve o agentId. */
  useEffect(() => {
    if (mode !== 'create' || !createPrefill?.assignCurrentAgent) return;
    if (!currentAgentId) return;
    setForm((current) => {
      if (current.agentIds.includes(currentAgentId)) return current;
      if (current.agentIds.length > 0) return current;
      return { ...current, agentIds: [currentAgentId] };
    });
  }, [mode, createPrefill?.assignCurrentAgent, currentAgentId]);

  const [tab, setTab] = useState<LeadFormTabValue>(initialTab ?? 'contact');
  const [photoBusy, setPhotoBusy] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [createTxOpen, setCreateTxOpen] = useState(false);
  const [createTxPrefill, setCreateTxPrefill] = useState<
    CreateTransactionPrefill | undefined
  >();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const serverStatusRef = useRef<LeadStatus>(seed.status);
  const createMutation = useCreateLeadMutation();
  const updateMutation = useUpdateLeadMutation();
  const deleteMutation = useDeleteLeadMutation();
  const { data: liveLead } = useLeadQuery(
    mode === 'edit' ? seed.id : undefined,
    mode === 'edit',
  );
  const activeDeal = liveLead?.activeDeal ?? initialLead?.activeDeal;
  const hasMatchedPropertyForPipeline =
    form.matchedProperties.length > 0 || Boolean(activeDeal?.propertyId);

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (mode !== 'edit' || !initialLead) return;
    if (initialLead.status === serverStatusRef.current) return;

    serverStatusRef.current = initialLead.status;
    setForm((current) => ({
      ...current,
      status: initialLead.status,
      activities: [...initialLead.activities],
    }));
  }, [mode, initialLead]);

  const handleLinkProperties = useCallback(() => {
    setTab('properties');
  }, []);

  const handleSendContract = useCallback(() => {
    setTab('documents');
  }, []);

  const handleCreateTransaction = useCallback(async () => {
    const lead = liveLead ?? initialLead;
    if (!lead) return;
    const prefill = await buildTransactionPrefillFromLead(lead, {
      initialStatus: 'CONTRACT_SIGNED',
      dealId: lead.activeDeal?.id,
      propertyId: lead.activeDeal?.propertyId,
      propertyName: lead.activeDeal?.propertyName,
    });
    setCreateTxPrefill(prefill);
    setCreateTxOpen(true);
  }, [liveLead, initialLead]);

  const handleStatusChange = useCallback((status: LeadStatus) => {
    setForm((current) => ({ ...current, status }));
  }, []);

  const initials = useMemo(
    () => (form.name ? initialsFromName(form.name) : seed.initials || '?'),
    [form.name, seed.initials],
  );

  const title = mode === 'create' ? 'Adicionar lead' : 'Detalhes do lead';

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function pushActivity(message: string, type: LeadActivity['type'] = 'property') {
    setForm((current) => ({
      ...current,
      activities: appendActivity(current.activities, {
        type,
        message,
        authorName: 'Você',
      }),
    }));
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('Informe o nome completo do lead.');
      setTab('contact');
      return;
    }

    const nextFollowUpIso = form.nextFollowUpIso;
    const latestFollowUpIso =
      form.latestFollowUpIso ||
      seed.latestFollowUp ||
      new Date().toISOString().slice(0, 10);

    let activities = [...form.activities];

    if (mode === 'create') {
      activities = appendActivity(activities, {
        type: 'system',
        message: 'Lead criado',
      });
    } else {
      if (seed.status !== form.status) {
        activities = appendActivity(activities, {
          type: 'status',
          message: `Status alterado para ${LEAD_STATUS_LABEL[form.status]}`,
          authorName: 'Você',
        });
      }
      if (!sameIdSet(seed.agentIds ?? [], form.agentIds)) {
        const names =
          form.agentIds.length === 0
            ? 'nenhum corretor'
            : form.agentIds.map(getTeamAgentName).join(', ');
        activities = appendActivity(activities, {
          type: 'assignment',
          message: `Corretores atualizados: ${names}`,
          authorName: 'Você',
        });
      }
    }

    const payload: LeadWriteInput = {
      name: form.name,
      email: form.email,
      phone: formatPhoneBR(form.phone),
      status: form.status,
      leadSource: form.leadSource,
      interestedPropertyType: form.interestedPropertyType,
      budgetRange: form.budgetRange.trim(),
      preferredLocation: form.preferredLocation,
      purpose: form.purpose,
      paymentIntents: form.paymentIntent ? [form.paymentIntent] : [],
      latestFollowUp: latestFollowUpIso,
      nextFollowUp: nextFollowUpIso ?? '',
      notes: form.notes,
      photoUrl: form.photoUrl,
      agentIds: form.agentIds,
      matchedProperties: form.matchedProperties,
      documents: form.documents.map(({ id, name, sizeLabel, kind, addedAt }) => ({
        id,
        name,
        sizeLabel,
        kind: kind === 'contract' ? 'contract' : 'other',
        addedAt,
      })),
      activities,
      propertyName: form.matchedProperties[0]?.name ?? '',
      hasSuggestion: seed.hasSuggestion,
    };

    try {
      if (mode === 'create') {
        await createMutation.mutateAsync(payload);
        toast.success('Lead criado', {
          description: `${form.name} foi adicionado à lista de leads.`,
        });
        router.push('/leads');
      } else {
        const updated = await updateMutation.mutateAsync({
          id: seed.id,
          input: payload,
        });
        if (!updated) {
          toast.error('Não foi possível salvar', {
            description: 'Lead não encontrado. Volte à lista e tente novamente.',
          });
          return;
        }
        toast.success('Alterações salvas', {
          description: `Os dados de ${form.name} foram atualizados.`,
        });
        router.push('/leads');
      }
    } catch (err) {
      toast.error('Não foi possível salvar o lead', {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  function handleContinueToProperties() {
    if (!form.name.trim()) {
      toast.error('Informe o nome completo do lead.');
      return;
    }
    setTab('properties');
  }

  function handlePrimaryAction() {
    if (mode === 'create' && tab === 'contact') {
      handleContinueToProperties();
      return;
    }
    void handleSave();
  }

  const primaryActionLabel =
    mode === 'create'
      ? tab === 'contact'
        ? 'Selecionar propriedade'
        : 'Criar lead'
      : 'Salvar alterações';

  const primaryActionPending =
    mode === 'create' && tab !== 'contact'
      ? createMutation.isPending
      : mode === 'edit'
        ? updateMutation.isPending
        : false;

  async function handleConfirmDelete() {
    if (mode !== 'edit') return;
    try {
      const removed = await deleteMutation.mutateAsync(seed.id);
      if (!removed) {
        toast.error('Não foi possível excluir o lead.');
        return;
      }
      setDeleteConfirmOpen(false);
      toast.success('Lead excluído', {
        description: `${form.name} foi removido da lista.`,
      });
      router.push('/leads');
    } catch (err) {
      toast.error('Não foi possível excluir o lead', {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  function handleUploadPhoto() {
    photoInputRef.current?.click();
  }

  async function handlePhotoSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setPhotoBusy(true);
    try {
      const dataUrl = await fileToProfileDataUrl(file);
      update('photoUrl', dataUrl);
      toast.success('Foto atualizada', {
        description: 'Salve o lead para manter a foto no perfil.',
      });
    } catch (error) {
      toast.error('Não foi possível enviar a foto', {
        description: error instanceof Error ? error.message : 'Tente outra imagem.',
      });
    } finally {
      setPhotoBusy(false);
    }
  }

  function handleRemovePhoto() {
    update('photoUrl', '');
  }

  return (
    <>
    <Stack spacing={2.5}>
      <ModuleBackLink href="/leads" label="Voltar para leads" />

      <Box
        sx={{
          display: 'grid',
          gap: 2.5,
          alignItems: 'start',
          gridTemplateColumns: {
            xs: '1fr',
            lg: 'minmax(240px, 280px) minmax(0, 1fr)',
          },
        }}
      >
        <LeadFormSidebar
          mode={mode}
          title={title}
          leadName={form.name}
          photoUrl={form.photoUrl}
          initials={initials}
          photoBusy={photoBusy}
          photoInputRef={photoInputRef}
          status={form.status}
          interestedPropertyType={form.interestedPropertyType}
          matchedProperties={form.matchedProperties}
          activeDeal={activeDeal}
          hasMatchedPropertyForPipeline={hasMatchedPropertyForPipeline}
          latestFollowUpDisplay={isoToDisplayDate(form.latestFollowUpIso)}
          nextFollowUpDisplay={isoToDisplayDate(form.nextFollowUpIso)}
          onStatusChange={handleStatusChange}
          onUploadPhoto={handleUploadPhoto}
          onRemovePhoto={handleRemovePhoto}
          onPhotoSelected={handlePhotoSelected}
          onLinkProperties={handleLinkProperties}
          onSendContract={mode === 'edit' ? handleSendContract : undefined}
          onCreateTransaction={
            mode === 'edit' && activeDeal?.status === 'active'
              ? handleCreateTransaction
              : undefined
          }
        />

        <Stack spacing={1.5} sx={{ minWidth: 0 }}>
          <LeadFormTabs value={tab} onChange={setTab} />

          <Panel
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5,
              p: { xs: 2, sm: 3 },
              minWidth: 0,
              maxWidth: '100%',
              overflowX: 'hidden',
            }}
          >
            {tab === 'contact' ? (
              <Stack spacing={3.5} id="contact">
                <Box>
                  <SectionTitle>Dados</SectionTitle>
                  <Box sx={FIELD_ROW_SX}>
                    <Field label="Nome completo" htmlFor="lead-name">
                      <Input
                        id="lead-name"
                        value={form.name}
                        onChange={(event) => update('name', event.target.value)}
                        placeholder="Nome do lead"
                        autoComplete="name"
                        autoFocus={Boolean(createPrefill?.focusClientName)}
                        fullWidth
                        sx={FIELD_SX}
                      />
                    </Field>
                    <Field label="E-mail" htmlFor="lead-email">
                      <Input
                        id="lead-email"
                        type="email"
                        value={form.email}
                        onChange={(event) => update('email', event.target.value)}
                        placeholder="email@exemplo.com"
                        autoComplete="email"
                        fullWidth
                        sx={FIELD_SX}
                      />
                    </Field>
                    <Field label="Telefone" htmlFor="lead-phone">
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          height: 48,
                          px: 1.5,
                          borderRadius: '12px',
                          bgcolor: 'secondary.light',
                          border: '1px solid',
                          borderColor: 'secondary.light',
                          '&:focus-within': {
                            borderColor: 'primary.main',
                          },
                        }}
                      >
                        <Typography
                          sx={{
                            flexShrink: 0,
                            fontSize: '1rem',
                            fontWeight: 500,
                            color: 'text.secondary',
                          }}
                        >
                          +55
                        </Typography>
                        <Input
                          id="lead-phone"
                          inputMode="tel"
                          value={form.phone}
                          onChange={(event) =>
                            update('phone', formatPhoneBR(event.target.value))
                          }
                          placeholder="(00) 00000-0000"
                          autoComplete="tel-national"
                          variant="standard"
                          fullWidth
                          slotProps={{ input: { disableUnderline: true } }}
                          sx={{ fontSize: '1rem' }}
                        />
                      </Box>
                    </Field>
                    <Field label="Origem do lead" htmlFor="lead-source">
                      <FormControl fullWidth>
                        <Select
                          id="lead-source"
                          value={form.leadSource}
                          onChange={(event) =>
                            update('leadSource', event.target.value as LeadSource)
                          }
                          sx={SELECT_SX}
                        >
                          {(Object.keys(LEAD_SOURCE_LABEL) as LeadSource[]).map((source) => (
                            <MenuItem key={source} value={source}>
                              {LEAD_SOURCE_LABEL[source]}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Field>
                  </Box>
                </Box>

                <Box>
                  <SectionTitle>Interesse no imóvel</SectionTitle>
                  <Box sx={FIELD_ROW_SX}>
                    <Field label="Tipo de imóvel" htmlFor="lead-property-type">
                      <FormControl fullWidth>
                        <Select
                          id="lead-property-type"
                          value={form.interestedPropertyType}
                          onChange={(event) =>
                            update(
                              'interestedPropertyType',
                              event.target.value as PropertyType,
                            )
                          }
                          sx={SELECT_SX}
                        >
                          {(Object.keys(PROPERTY_TYPE_LABEL) as PropertyType[]).map((type) => (
                            <MenuItem key={type} value={type}>
                              {PROPERTY_TYPE_LABEL[type]}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Field>
                    <Field label="Faixa de orçamento" htmlFor="lead-budget">
                      <Input
                        id="lead-budget"
                        inputMode="decimal"
                        value={form.budgetRange}
                        onChange={(event) =>
                          update('budgetRange', maskBudgetInput(event.target.value))
                        }
                        placeholder="R$ 500.000 – R$ 650.000"
                        fullWidth
                        sx={FIELD_SX}
                        slotProps={{
                          input: {
                            startAdornment: (
                              <AttachMoneyOutlinedIcon
                                sx={{ fontSize: 18, color: 'text.secondary', mr: 0.5 }}
                              />
                            ),
                          },
                        }}
                      />
                    </Field>
                    <Field label="Localização preferida" htmlFor="lead-location">
                      <Input
                        id="lead-location"
                        value={form.preferredLocation}
                        onChange={(event) => update('preferredLocation', event.target.value)}
                        placeholder="Cidade, bairro"
                        fullWidth
                        sx={FIELD_SX}
                      />
                    </Field>
                    <Field label="Finalidade" htmlFor="lead-purpose">
                      <FormControl fullWidth>
                        <Select
                          id="lead-purpose"
                          value={form.purpose}
                          onChange={(event) =>
                            update('purpose', event.target.value as LeadPurpose)
                          }
                          sx={SELECT_SX}
                        >
                          {(Object.keys(LEAD_PURPOSE_LABEL) as LeadPurpose[]).map((purpose) => (
                            <MenuItem key={purpose} value={purpose}>
                              {LEAD_PURPOSE_LABEL[purpose]}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Field>
                    <Field label="Intenção de pagamento" htmlFor="lead-payment-intent">
                      <FormControl fullWidth>
                        <Select
                          id="lead-payment-intent"
                          value={form.paymentIntent}
                          displayEmpty
                          onChange={(event) =>
                            update(
                              'paymentIntent',
                              event.target.value as LeadPaymentIntent | '',
                            )
                          }
                          sx={SELECT_SX}
                        >
                          <MenuItem value="">Não informado</MenuItem>
                          {LEAD_PAYMENT_INTENTS.map((intent) => (
                            <MenuItem key={intent} value={intent}>
                              {LEAD_PAYMENT_INTENT_LABEL[intent]}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Field>
                  </Box>
                </Box>

                <Box sx={{ minWidth: 0, maxWidth: '100%' }}>
                  <SectionTitle>Follow-up e atribuições</SectionTitle>
                  <Box
                    sx={{
                      ...FIELD_ROW_SX,
                      gridTemplateColumns: {
                        xs: 'repeat(2, minmax(0, 1fr))',
                        md: 'repeat(4, minmax(0, 1fr))',
                      },
                    }}
                  >
                    <Field
                      label="Último follow-up"
                      htmlFor="lead-latest-follow-up"
                      sx={{ gridColumn: { md: 'span 2' } }}
                    >
                      <DatePicker
                        id="lead-latest-follow-up"
                        label=""
                        placeholder="Data"
                        value={isoDateToLocalDate(form.latestFollowUpIso)}
                        disabled
                        sx={DATE_PICKER_SX}
                      />
                    </Field>
                    <Field
                      label="Próximo follow-up"
                      htmlFor="lead-next-follow-up"
                      sx={{ gridColumn: { md: 'span 2' } }}
                    >
                      <DatePicker
                        id="lead-next-follow-up"
                        label=""
                        placeholder="Data"
                        value={isoDateToLocalDate(form.nextFollowUpIso)}
                        onChange={(date) =>
                          update('nextFollowUpIso', localDateToIsoDate(date))
                        }
                        sx={DATE_PICKER_SX}
                      />
                    </Field>
                    <Field
                      label="Notas"
                      htmlFor="lead-notes"
                      sx={{ gridColumn: '1 / -1' }}
                    >
                      <Input
                        id="lead-notes"
                        multiline
                        minRows={4}
                        value={form.notes}
                        onChange={(event) => update('notes', event.target.value)}
                        placeholder="Preferências, observações e próximos passos…"
                        fullWidth
                        sx={leadTabMultilineSx}
                      />
                    </Field>
                  </Box>
                </Box>

                <Box>
                  <SectionTitle>Equipe</SectionTitle>
                  <LeadAgentsField
                    agentIds={form.agentIds}
                    onChange={(agentIds) => update('agentIds', agentIds)}
                  />
                </Box>
              </Stack>
            ) : null}

            {tab === 'properties' ? (
              <Box id="properties">
                <LeadPropertiesTab
                  matchedProperties={form.matchedProperties}
                  interestedPropertyType={form.interestedPropertyType}
                  onChange={(matchedProperties) => update('matchedProperties', matchedProperties)}
                  onActivity={(message) => pushActivity(message, 'property')}
                />
              </Box>
            ) : null}

            {tab === 'documents' ? (
              <LeadDocumentsTab
                leadId={mode === 'edit' ? seed.id : undefined}
                documents={form.documents}
                contact={{
                  name: form.name,
                  email: form.email,
                  phone: form.phone,
                }}
                onChange={(documents) => update('documents', documents)}
                onActivity={(message) => pushActivity(message, 'document')}
                activeDeal={activeDeal}
              />
            ) : null}

            {tab === 'activity' ? (
              <LeadActivityTab
                activities={form.activities}
                onChange={(activities) => update('activities', activities)}
              />
            ) : null}

            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'stretch', pt: 0.5 }}>
              <Button
                type="button"
                variant="contained"
                fullWidth
                disabled={primaryActionPending}
                onClick={handlePrimaryAction}
                sx={{
                  height: 52,
                  borderRadius: '20px',
                  fontSize: '1rem',
                  fontWeight: 500,
                  textTransform: 'none',
                  boxShadow: 'none',
                }}
              >
                {primaryActionPending ? 'Salvando…' : primaryActionLabel}
              </Button>
              {mode === 'edit' ? (
                <IconButton
                  aria-label="Excluir lead"
                  onClick={() => setDeleteConfirmOpen(true)}
                  disabled={deleteMutation.isPending}
                  sx={{
                    width: 52,
                    height: 52,
                    flexShrink: 0,
                    borderRadius: '16px',
                    bgcolor: listifyError[0],
                    color: listifyError[100],
                    '&:hover': { bgcolor: listifyError[25] },
                  }}
                >
                  <DeleteOutlinedIcon />
                </IconButton>
              ) : null}
            </Stack>
          </Panel>
        </Stack>
      </Box>
    </Stack>

      <Modal
        open={deleteConfirmOpen}
        onClose={() => {
          if (deleteMutation.isPending) return;
          setDeleteConfirmOpen(false);
        }}
        maxWidth="xs"
        fullWidth
      >
        <ModalScrollBody>
          <ModalTitle>Excluir lead?</ModalTitle>
          <ModalContent>
            <ModalDescription>
              Tem certeza que deseja excluir{' '}
              <Box component="span" sx={{ fontWeight: 600 }}>
                {form.name || 'este lead'}
              </Box>
              ? Esta ação não pode ser desfeita.
            </ModalDescription>
          </ModalContent>
          <ModalActions>
            <ModalCancelButton
              disabled={deleteMutation.isPending}
              onClick={() => setDeleteConfirmOpen(false)}
            />
            <ModalConfirmButton
              disabled={deleteMutation.isPending}
              onClick={handleConfirmDelete}
            >
              {deleteMutation.isPending ? 'Excluindo…' : 'Excluir'}
            </ModalConfirmButton>
          </ModalActions>
        </ModalScrollBody>
      </Modal>

      <CreateTransactionDialog
        open={createTxOpen}
        onOpenChange={setCreateTxOpen}
        prefill={createTxPrefill}
      />
    </>
  );
}
