import { CURRENT_AGENT_ID } from '@/features/shared/constants/agents';
import type { ContactLeadDetail, DealStage } from '@/features/leads/types';
import {
  getPropertyById,
  listProperties,
} from '@/features/properties/services/properties-service';
import { isPropertyPromotableForLinkedLead } from '@/features/properties/utils/property-availability';
import type { CreateTransactionPrefill, TransactionType } from '../types';
import { mapLeadPaymentIntentsToTransactionMethod } from './map-lead-payment-intent';
import {
  parseBudgetRangeToCents,
  propertyCostToCents,
} from './parse-budget-to-cents';

const CONTRACT_READY_STAGES: readonly DealStage[] = [
  'contract_sent',
  'contract_signed',
  'payment_confirmed',
  'handover',
];

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

/** Ordem: imóvel preferido (deal) → demais matched do lead. */
export function collectLeadPropertyCandidateIds(
  lead: ContactLeadDetail,
  preferredPropertyId?: string | null,
): string[] {
  const ids: string[] = [];
  const push = (id: string | null | undefined) => {
    const trimmed = id?.trim();
    if (!trimmed || ids.includes(trimmed)) return;
    ids.push(trimmed);
  };

  push(preferredPropertyId);
  push(lead.activeDeal?.propertyId);
  for (const matched of lead.matchedProperties) {
    push(matched.id);
  }
  return ids;
}

async function resolvePropertyIdForLead(
  lead: ContactLeadDetail,
  preferredPropertyId?: string | null,
): Promise<string | undefined> {
  const candidates = collectLeadPropertyCandidateIds(lead, preferredPropertyId);
  let fallbackLinked: string | undefined;

  // Imóveis já linkados ao lead ficam pré-selecionados (mesmo `reserved`).
  for (const id of candidates) {
    fallbackLinked ??= id;
    try {
      const property = await getPropertyById(id);
      if (isPropertyPromotableForLinkedLead(property)) return id;
    } catch {
      // Mantém o id linkado para o modal mesmo se o detalhe falhar.
    }
  }
  if (fallbackLinked) return fallbackLinked;

  if (!lead.propertyName) return undefined;

  const listed = (
    await listProperties({
      search: lead.propertyName,
      perPage: 50,
      status: ['available'],
    })
  ).data;
  const exact = listed.find(
    (p) => normalize(p.name) === normalize(lead.propertyName!),
  );
  return exact?.id ?? listed[0]?.id;
}

function resolveInitialStatus(
  lead: ContactLeadDetail,
  options?: { initialStatus?: 'PROPOSAL' | 'CONTRACT_SIGNED' },
): 'PROPOSAL' | 'CONTRACT_SIGNED' {
  if (options?.initialStatus) return options.initialStatus;

  const stage = lead.activeDeal?.stage;
  if (stage && CONTRACT_READY_STAGES.includes(stage)) {
    return 'CONTRACT_SIGNED';
  }

  const hasProperty =
    lead.matchedProperties.length > 0 || Boolean(lead.propertyName?.trim());
  return hasProperty ? 'CONTRACT_SIGNED' : 'PROPOSAL';
}

export async function buildTransactionPrefillFromLead(
  lead: ContactLeadDetail,
  options?: {
    initialStatus?: 'PROPOSAL' | 'CONTRACT_SIGNED';
    dealId?: string;
    propertyId?: string | null;
    propertyName?: string | null;
  },
): Promise<CreateTransactionPrefill> {
  const matchedProperties = lead.matchedProperties.map((item) => ({
    id: item.id,
    name: item.name,
    coverPhotoUrl: item.coverPhotoUrl,
  }));
  const preferredId = options?.propertyId?.trim() || lead.activeDeal?.propertyId;
  if (
    preferredId &&
    !matchedProperties.some((item) => item.id === preferredId)
  ) {
    matchedProperties.unshift({
      id: preferredId,
      name:
        options?.propertyName?.trim() ||
        lead.activeDeal?.propertyName?.trim() ||
        lead.propertyName?.trim() ||
        'Imóvel selecionado',
      coverPhotoUrl: undefined,
    });
  }
  const propertyId = await resolvePropertyIdForLead(lead, options?.propertyId);
  const selectedMatch = matchedProperties.find((item) => item.id === propertyId);
  const type: TransactionType = lead.purpose === 'renting' ? 'RENTAL' : 'SALE';

  let grossValueCents = parseBudgetRangeToCents(lead.budgetRange);
  if (propertyId) {
    try {
      const property = await getPropertyById(propertyId);
      if (property) {
        grossValueCents =
          propertyCostToCents(property.cost) ?? grossValueCents;
      }
    } catch {
      // Mantém o parse do orçamento se o detalhe do imóvel falhar.
    }
  }

  return {
    leadId: lead.id,
    leadName: lead.name,
    dealId: options?.dealId ?? lead.activeDeal?.id,
    propertyId,
    propertyName:
      selectedMatch?.name ??
      options?.propertyName?.trim() ??
      matchedProperties[0]?.name ??
      lead.propertyName ??
      undefined,
    matchedProperties,
    sellerId: lead.agentIds[0] ?? lead.agentId ?? CURRENT_AGENT_ID,
    type,
    initialStatus: resolveInitialStatus(lead, options),
    paymentMethod: mapLeadPaymentIntentsToTransactionMethod(lead.paymentIntents),
    grossValueCents,
  };
}

