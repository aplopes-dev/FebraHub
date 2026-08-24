'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { SelectChangeEvent } from '@mui/material/Select';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useQueries } from '@tanstack/react-query';
import { toast } from '@citybox/mui/molecules';
import {
  Avatar,
  Box,
  Input,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@citybox/mui/atoms';
import {
  Modal,
  ModalActions,
  ModalCancelButton,
  ModalConfirmButton,
  ModalContent,
  ModalScrollBody,
  ModalTitle,
  modalFieldRootSx,
  modalSearchFieldSx,
  modalSectionTitleSx,
  modalSelectFieldSx,
} from '@/components/ui/modal';
import { SearchInput } from '@citybox/mui/molecules';
import { SCROLL_CLASS } from '@/lib/scroll';
import { useAssignableTransactionAgents } from '@/features/settings/hooks/use-team-members-by-permission';
import { useSessionUser } from '@/features/shared/session/hooks/use-session';
import { useSessionAgentScope } from '@/features/shared/session/hooks/use-session-agent-scope';
import { canEditSplit } from '@/features/shared/session/utils/permissions';
import {
  useLeadQuery,
  useLeadsQuery,
} from '@/features/leads/hooks/use-leads-queries';
import { useDebouncedValue } from '@/features/leads/hooks/use-debounced-value';
import type { ContactLeadDetail } from '@/features/leads/types';
import {
  usePropertiesQuery,
  usePropertyQuery,
} from '@/features/properties/hooks/use-properties-queries';
import { propertyKeys } from '@/features/properties/hooks/query-keys';
import { getPropertyById } from '@/features/properties/services/properties-service';
import type { PropertyListing } from '@/features/properties/types';
import {
  isPropertyAvailableForSelection,
  isPropertyPromotableForLinkedLead,
} from '@/features/properties/utils/property-availability';
import {
  createTransactionSchema,
  formatCentsToCurrencyInput,
  maskCurrencyInput,
  parseCurrencyToCents,
} from '../schemas/transaction-schema';
import { useCreateTransaction } from '../hooks/use-create-transaction';
import type { CreateTransactionPrefill, TransactionType } from '../types';
import { mapLeadPaymentIntentsToTransactionMethod, asCreatablePaymentMethod } from '../utils/map-lead-payment-intent';
import { PropertyPickerPreview } from './property-picker-preview';
import { LeadPickerPreview } from '@/features/calendar/components/lead-picker-preview';
import {
  TRANSACTION_PAYMENT_METHOD_OPTIONS,
  type CreatableTransactionPaymentMethod,
} from '../lib/payment-method-labels';

type CreateTransactionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefill?: CreateTransactionPrefill;
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function mergeSelectedOption<T extends { id: string }>(
  options: readonly T[],
  selectedId: string,
  selected: T | null | undefined,
): readonly T[] {
  if (!selectedId || options.some((item) => item.id === selectedId)) {
    return options;
  }
  return selected ? [selected, ...options] : options;
}


type MatchedPropertyEntry = {
  id: string;
  name: string;
  coverPhotoUrl?: string;
};

function resolveMatchedEntries(
  prefill: CreateTransactionPrefill | undefined,
  selectedLead: ContactLeadDetail | null | undefined,
): readonly MatchedPropertyEntry[] {
  const entries: MatchedPropertyEntry[] = [];
  const push = (
    id: string | null | undefined,
    name?: string | null,
    coverPhotoUrl?: string | null,
  ) => {
    const trimmed = id?.trim();
    if (!trimmed) return;
    const index = entries.findIndex((item) => item.id === trimmed);
    if (index >= 0) {
      const current = entries[index]!;
      if (!current.coverPhotoUrl && coverPhotoUrl) {
        entries[index] = { ...current, coverPhotoUrl };
      }
      return;
    }
    entries.push({
      id: trimmed,
      name: name?.trim() || 'Imóvel selecionado',
      ...(coverPhotoUrl ? { coverPhotoUrl } : {}),
    });
  };

  push(prefill?.propertyId, prefill?.propertyName);
  push(
    selectedLead?.activeDeal?.propertyId,
    selectedLead?.activeDeal?.propertyName,
  );

  const matched =
    prefill?.matchedProperties && prefill.matchedProperties.length > 0
      ? prefill.matchedProperties
      : (selectedLead?.matchedProperties ?? []);
  for (const item of matched) {
    push(item.id, item.name, item.coverPhotoUrl);
  }

  return entries;
}

export function CreateTransactionDialog({
  open,
  onOpenChange,
  prefill,
}: CreateTransactionDialogProps) {
  const sessionUser = useSessionUser();
  const { agentId, ready: scopeReady } = useSessionAgentScope();
  const createMutation = useCreateTransaction();
  const valueInputRef = useRef<HTMLInputElement>(null);

  const isSingleAgent = sessionUser.organization.type === 'SINGLE_AGENT';
  const canPickSeller =
    sessionUser.organization.type === 'AGENCY' && canEditSplit(sessionUser.role);
  const fromLead = Boolean(prefill?.leadId);

  const [type, setType] = useState<TransactionType>('SALE');
  const [propertyId, setPropertyId] = useState('');
  const [leadId, setLeadId] = useState('');
  const [dealId, setDealId] = useState('');
  const [currencyInput, setCurrencyInput] = useState('');
  const [sellerId, setSellerId] = useState(sessionUser.id);
  const [initialStatus, setInitialStatus] = useState<'PROPOSAL' | 'CONTRACT_SIGNED'>(
    'PROPOSAL',
  );
  const [paymentMethod, setPaymentMethod] = useState<CreatableTransactionPaymentMethod | ''>(
    '',
  );

  const [propertySearch, setPropertySearch] = useState('');
  const [leadSearch, setLeadSearch] = useState('');
  const debouncedPropertySearch = useDebouncedValue(propertySearch, 400);
  const debouncedLeadSearch = useDebouncedValue(leadSearch, 400);

  useEffect(() => {
    if (!open) return;
    setType(prefill?.type ?? 'SALE');
    setPropertyId(prefill?.propertyId ?? '');
    setLeadId(prefill?.leadId ?? '');
    setDealId(prefill?.dealId ?? '');
    setSellerId(prefill?.sellerId ?? sessionUser.id);
    setInitialStatus(
      prefill?.initialStatus === 'CONTRACT_SIGNED' ? 'CONTRACT_SIGNED' : 'PROPOSAL',
    );
    setCurrencyInput(
      prefill?.grossValueCents
        ? formatCentsToCurrencyInput(prefill.grossValueCents)
        : '',
    );
    setPaymentMethod(asCreatablePaymentMethod(prefill?.paymentMethod));
    setPropertySearch('');
    setLeadSearch('');
    queueMicrotask(() => {
      valueInputRef.current?.focus();
    });
  }, [open, prefill, sessionUser.id]);

  const { members: transactionAgents } = useAssignableTransactionAgents();

  const { data: leadsResult } = useLeadsQuery(
    {
      search: debouncedLeadSearch,
      page: 1,
      perPage: 20,
      ...(agentId ? { agentId } : {}),
    },
    open && !fromLead && scopeReady,
  );
  const { data: selectedLead } = useLeadQuery(leadId || undefined, open && Boolean(leadId));

  useEffect(() => {
    if (!open || !selectedLead?.activeDeal?.id) return;
    setDealId(selectedLead.activeDeal.id);
  }, [open, selectedLead?.activeDeal?.id]);

  const selectedPaymentIntents = selectedLead?.paymentIntents;

  useEffect(() => {
    if (!open || fromLead) return;
    const mapped = mapLeadPaymentIntentsToTransactionMethod(
      selectedPaymentIntents,
    );
    setPaymentMethod(mapped ?? '');
  }, [open, fromLead, leadId, selectedPaymentIntents]);

  const matchedEntries = useMemo(
    () => resolveMatchedEntries(prefill, selectedLead),
    [prefill, selectedLead],
  );

  const matchedPropertyQueries = useQueries({
    queries: matchedEntries.map((entry) => ({
      queryKey: propertyKeys.detail(entry.id),
      queryFn: () => getPropertyById(entry.id),
      enabled: open && Boolean(entry.id),
    })),
  });

  const matchedLeadProperties = useMemo(() => {
    const byId = new Map<string, PropertyListing>();
    for (const query of matchedPropertyQueries) {
      if (query.data) byId.set(query.data.id, query.data);
    }
    return matchedEntries
      .map((entry) => byId.get(entry.id))
      .filter((property): property is PropertyListing => Boolean(property));
  }, [matchedEntries, matchedPropertyQueries]);

  /** Linkados ao lead: available + reserved (já indisponíveis para outros). */
  const matchedPromotableProperties = useMemo(
    () =>
      matchedLeadProperties.filter((property) =>
        isPropertyPromotableForLinkedLead(property),
      ),
    [matchedLeadProperties],
  );

  const { data: propertiesResult } = usePropertiesQuery(
    {
      search: debouncedPropertySearch,
      perPage: 20,
      status: ['available'],
      ...(agentId ? { agentId } : {}),
    },
    open && scopeReady && matchedEntries.length === 0,
  );
  const {
    data: selectedPropertyData,
    isLoading: isLoadingSelectedProperty,
    isError: isSelectedPropertyError,
  } = usePropertyQuery(propertyId || undefined, open && Boolean(propertyId));

  useEffect(() => {
    if (!open || !propertyId) return;
    // Não limpa enquanto carrega — o MenuItem do lead já mostra a seleção.
    if (isLoadingSelectedProperty) return;
    if (matchedEntries.some((item) => item.id === propertyId)) {
      if (!selectedPropertyData) return;
      if (isPropertyPromotableForLinkedLead(selectedPropertyData)) return;
      // sold-out/occupied linkado: ainda mantém no modal (usuário vê o imóvel).
      return;
    }
    if (!selectedPropertyData) {
      if (isSelectedPropertyError) {
        setPropertyId('');
        toast.error(
          'O imóvel vinculado não está disponível. Selecione outro imóvel.',
        );
      }
      return;
    }
    if (isPropertyPromotableForLinkedLead(selectedPropertyData)) return;

    const fallback = matchedPromotableProperties.find(
      (item) => item.id !== propertyId,
    );
    if (fallback) {
      setPropertyId(fallback.id);
      toast.message('Imóvel indisponível', {
        description: `Selecionamos ${fallback.name}, outro imóvel escolhido no lead.`,
      });
      return;
    }

    setPropertyId('');
    toast.error(
      'O imóvel vinculado não está disponível. Selecione outro imóvel.',
    );
  }, [
    open,
    propertyId,
    selectedPropertyData,
    isLoadingSelectedProperty,
    isSelectedPropertyError,
    matchedEntries,
    matchedPromotableProperties,
  ]);

  const matchedOptionIds = useMemo(
    () => new Set(matchedEntries.map((item) => item.id)),
    [matchedEntries],
  );

  const propertyOptions = useMemo(() => {
    const list = (propertiesResult?.data ?? []).filter((property) =>
      isPropertyAvailableForSelection(property),
    );
    if (
      !propertyId ||
      !selectedPropertyData ||
      !isPropertyAvailableForSelection(selectedPropertyData)
    ) {
      return list;
    }
    return mergeSelectedOption(list, propertyId, selectedPropertyData);
  }, [propertiesResult?.data, propertyId, selectedPropertyData]);

  const leadOptions = useMemo((): readonly ContactLeadDetail[] => {
    const list = leadsResult?.data ?? [];
    return mergeSelectedOption(list, leadId, selectedLead);
  }, [leadsResult?.data, leadId, selectedLead]);

  const selectedProperty = selectedPropertyData ?? null;
  const hideStatusPicker =
    prefill?.initialStatus === 'CONTRACT_SIGNED' && canPickSeller;
  const hasMatchedOptions = matchedEntries.length > 0;

  function handleSubmit() {
    const isLinkedMatch = matchedOptionIds.has(selectedProperty?.id ?? propertyId);
    if (
      selectedProperty &&
      !(
        isPropertyAvailableForSelection(selectedProperty) ||
        (isLinkedMatch && isPropertyPromotableForLinkedLead(selectedProperty))
      )
    ) {
      toast.error('Selecione um imóvel disponível ou já vinculado a este lead.');
      return;
    }

    const grossValueCents = parseCurrencyToCents(currencyInput);
    const draft = {
      type,
      propertyId,
      leadId,
      dealId: dealId || undefined,
      grossValueCents,
      paymentMethod,
      sellerId: isSingleAgent ? sessionUser.id : sellerId,
      initialStatus,
    };

    const parsed = createTransactionSchema.safeParse(draft);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message;
      toast.error(firstError ?? 'Verifique os campos do formulário.');
      return;
    }

    createMutation.mutate(parsed.data, {
      onSuccess: () => onOpenChange(false),
    });
  }

  return (
    <Modal open={open} onClose={() => onOpenChange(false)} maxWidth="sm" fullWidth>
      <ModalScrollBody>
        <ModalTitle>
          {fromLead ? 'Promover lead para transação' : 'Nova transação'}
        </ModalTitle>

        <ModalContent sx={{ pt: 0, gap: 1.5 }}>
          <Select
            value={type}
            onChange={(event) =>
              setType((event as SelectChangeEvent<TransactionType>).target.value)
            }
            displayEmpty
            slotProps={{
              input: { 'aria-label': 'Tipo de negócio' },
            }}
            sx={modalSelectFieldSx}
          >
            <MenuItem value="SALE">Venda</MenuItem>
            <MenuItem value="RENTAL">Locação</MenuItem>
          </Select>

          <Stack spacing={1.25} sx={{ pt: 0.5 }}>
            <Typography sx={modalSectionTitleSx}>Imóvel</Typography>
            {hasMatchedOptions ? (
              <Accordion
                disableGutters
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '16px !important',
                  bgcolor: 'background.paper',
                  '&:before': { display: 'none' },
                  overflow: 'hidden',
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="matched-properties-content"
                  id="matched-properties-header"
                  sx={{
                    minHeight: 48,
                    px: 2,
                    '& .MuiAccordionSummary-content': {
                      my: 1,
                      alignItems: 'center',
                      gap: 1,
                    },
                  }}
                >
                  <Typography sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                    Imóveis selecionados
                  </Typography>
                  <Typography color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    {matchedEntries.length}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 1.5, pb: 1.5, pt: 0 }}>
                  <Stack
                    spacing={1}
                    className={SCROLL_CLASS}
                    sx={{ maxHeight: 280, overflowY: 'auto' }}
                  >
                    {matchedEntries.map((entry) => {
                      const loaded = matchedLeadProperties.find(
                        (property) => property.id === entry.id,
                      );
                      return (
                        <PropertyPickerPreview
                          key={entry.id}
                          property={loaded}
                          fallbackName={entry.name}
                          fallbackCoverUrl={entry.coverPhotoUrl}
                          selected={propertyId === entry.id}
                          onSelect={() => setPropertyId(entry.id)}
                        />
                      );
                    })}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            ) : (
              <>
                <SearchInput
                  value={propertySearch}
                  onChange={(e) => setPropertySearch(e.target.value)}
                  placeholder="Buscar imóvel…"
                  fullWidth
                  sx={modalSearchFieldSx}
                />
                <Select
                  value={propertyId}
                  onChange={(e) => setPropertyId(String(e.target.value))}
                  displayEmpty
                  slotProps={{
                    input: { 'aria-label': 'Selecione o imóvel' },
                  }}
                  sx={modalSelectFieldSx}
                >
                  <MenuItem value="" disabled>
                    Selecione o imóvel
                  </MenuItem>
                  {propertyOptions.map((property) => (
                    <MenuItem key={property.id} value={property.id}>
                      {property.name} — {property.city}
                    </MenuItem>
                  ))}
                </Select>
                {selectedProperty ? (
                  <PropertyPickerPreview property={selectedProperty} />
                ) : null}
              </>
            )}
          </Stack>

          <Stack spacing={1.25} sx={{ pt: 0.5 }}>
            <Typography sx={modalSectionTitleSx}>
              {fromLead ? 'Lead' : 'Escolher lead'}
            </Typography>

            {fromLead && selectedLead ? (
              <LeadPickerPreview
                lead={{
                  id: selectedLead.id,
                  name: selectedLead.name,
                  email: selectedLead.email,
                  phone: selectedLead.phone,
                  photoUrl: selectedLead.photoUrl,
                  initials: selectedLead.initials || initials(selectedLead.name),
                }}
              />
            ) : (
              <>
                <SearchInput
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  placeholder="Buscar lead…"
                  fullWidth
                  sx={modalSearchFieldSx}
                />
                <Box
                  component="ul"
                  className={SCROLL_CLASS}
                  sx={{
                    listStyle: 'none',
                    m: 0,
                    p: 0,
                    maxHeight: 180,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5,
                  }}
                >
                  {leadOptions.map((lead) => {
                    const selected = leadId === lead.id;
                    return (
                      <Box component="li" key={lead.id}>
                        <Box
                          component="button"
                          type="button"
                          onClick={() => setLeadId(lead.id)}
                          sx={{
                            display: 'flex',
                            width: '100%',
                            alignItems: 'center',
                            gap: 1.25,
                            border: '1px solid',
                            borderColor: selected ? 'divider' : 'transparent',
                            cursor: 'pointer',
                            textAlign: 'left',
                            borderRadius: '12px',
                            px: 1.25,
                            py: 1,
                            bgcolor: selected ? 'secondary.light' : 'transparent',
                            color: 'text.primary',
                            transition: 'background-color 0.15s, border-color 0.15s',
                            '&:hover': {
                              bgcolor: 'secondary.main',
                              borderColor: 'divider',
                            },
                          }}
                        >
                          <Avatar
                            src={lead.photoUrl ?? undefined}
                            alt={lead.name}
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: '10px',
                              bgcolor: 'action.selected',
                              color: 'text.secondary',
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            {lead.initials || initials(lead.name)}
                          </Avatar>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                              noWrap
                              sx={{
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                lineHeight: 1.35,
                                color: 'text.primary',
                              }}
                            >
                              {lead.name}
                            </Typography>
                            <Typography
                              noWrap
                              sx={{
                                fontSize: '0.75rem',
                                fontWeight: 400,
                                lineHeight: 1.35,
                                color: 'text.secondary',
                              }}
                            >
                              {[lead.phone, lead.email].filter(Boolean).join(' · ') ||
                                'Sem telefone ou e-mail'}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
                {selectedLead ? (
                  <LeadPickerPreview
                    lead={{
                      id: selectedLead.id,
                      name: selectedLead.name,
                      email: selectedLead.email,
                      phone: selectedLead.phone,
                      photoUrl: selectedLead.photoUrl,
                      initials: selectedLead.initials || initials(selectedLead.name),
                    }}
                  />
                ) : null}
              </>
            )}
          </Stack>

          <Input
            inputRef={valueInputRef}
            id="tx-value"
            value={currencyInput}
            placeholder="Valor de fechamento (R$)"
            inputMode="numeric"
            fullWidth
            slotProps={{
              htmlInput: { 'aria-label': 'Valor de fechamento (R$)' },
            }}
            sx={modalFieldRootSx}
            onChange={(e) => setCurrencyInput(maskCurrencyInput(e.target.value))}
          />

          <Stack spacing={1.25} sx={{ pt: 0.5 }}>
            <Typography sx={modalSectionTitleSx}>Meio de pagamento</Typography>
            <Select
              value={paymentMethod}
              onChange={(event) =>
                setPaymentMethod(
                  String(event.target.value) as CreatableTransactionPaymentMethod,
                )
              }
              displayEmpty
              slotProps={{
                input: { 'aria-label': 'Meio de pagamento' },
              }}
              sx={modalSelectFieldSx}
            >
              <MenuItem value="" disabled>
                Selecione o meio de pagamento
              </MenuItem>
              {TRANSACTION_PAYMENT_METHOD_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </Stack>

          {canPickSeller ? (
            <Select
              value={sellerId}
              onChange={(e) => setSellerId(String(e.target.value))}
              displayEmpty
              slotProps={{
                input: { 'aria-label': 'Corretor vendedor' },
              }}
              sx={modalSelectFieldSx}
            >
              {transactionAgents.map((agent) => (
                <MenuItem key={agent.id} value={agent.id}>
                  {agent.name}
                </MenuItem>
              ))}
            </Select>
          ) : null}

          {canPickSeller && !hideStatusPicker ? (
            <Select
              value={initialStatus}
              onChange={(e) =>
                setInitialStatus(e.target.value as 'PROPOSAL' | 'CONTRACT_SIGNED')
              }
              displayEmpty
              slotProps={{
                input: { 'aria-label': 'Status inicial' },
              }}
              sx={modalSelectFieldSx}
            >
              <MenuItem value="PROPOSAL">Proposta</MenuItem>
              <MenuItem value="CONTRACT_SIGNED">Contrato assinado</MenuItem>
            </Select>
          ) : null}
        </ModalContent>

        <ModalActions sx={{ gap: 1.5 }}>
          <ModalCancelButton type="button" onClick={() => onOpenChange(false)}>
            Cancelar
          </ModalCancelButton>
          <ModalConfirmButton
            type="button"
            disabled={createMutation.isPending}
            onClick={handleSubmit}
            sx={{ flex: 1.2 }}
          >
            {createMutation.isPending ? 'Criando…' : 'Criar transação'}
          </ModalConfirmButton>
        </ModalActions>
      </ModalScrollBody>
    </Modal>
  );
}
