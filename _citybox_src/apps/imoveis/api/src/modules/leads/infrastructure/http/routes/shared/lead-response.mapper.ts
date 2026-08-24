import type { LeadEntity } from '../../../../domain/entities/lead.entity';
import {
  PROPERTY_TYPE_LABEL,
  PURPOSE_LABEL,
} from '../../../../domain/mappers/lead-enum.mapper';

function toDateOnly(value: Date | null | undefined): string {
  if (!value) return '';
  return value.toISOString().slice(0, 10);
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1]?.[0] ?? ''}`.toUpperCase();
}

/** Shape HTTP de um lead (sem envelope `{ data }`). */
export function mapLeadToHttp(lead: LeadEntity) {
  const budgetRange = lead.budgetRange.trim();
  return {
    id: lead.id,
    name: lead.name,
    initials: initialsFromName(lead.name),
    email: lead.email || undefined,
    phone: lead.phone || undefined,
    city: lead.city || undefined,
    state: lead.state || undefined,
    status: lead.status,
    intent: `${PROPERTY_TYPE_LABEL[lead.interestedPropertyType]} — ${PURPOSE_LABEL[lead.purpose]}`,
    budgetLabel: budgetRange || '—',
    lastContactedAt:
      toDateOnly(lead.latestFollowUp) || toDateOnly(lead.updatedAt),
    propertyName: lead.propertyName || undefined,
    hasSuggestion: lead.hasSuggestion || undefined,
    photoUrl: lead.photoUrl || undefined,
    leadSource: lead.leadSource,
    interestedPropertyType: lead.interestedPropertyType,
    budgetRange,
    preferredLocation: lead.preferredLocation,
    purpose: lead.purpose,
    paymentIntents: [...lead.paymentIntents],
    latestFollowUp: toDateOnly(lead.latestFollowUp),
    nextFollowUp: toDateOnly(lead.nextFollowUp),
    notes: lead.notes,
    agentIds: [...lead.agentIds],
    matchedProperties: lead.matchedProperties.map((p) => ({
      id: p.propertyId,
      name: p.propertyName,
      coverPhotoUrl: p.coverPhotoUrl ?? undefined,
    })),
    documents: lead.documents.map((d) => ({
      id: d.id,
      name: d.name,
      sizeLabel: d.sizeLabel,
      kind: d.kind,
      addedAt: toDateOnly(d.addedAt),
      path: d.objectKey
        ? `/v1/leads/${lead.id}/documents/${d.id}`
        : undefined,
      mimeType: d.mimeType ?? undefined,
      sentAt: d.sentAt?.toISOString(),
      sentChannel: d.sentChannel ?? undefined,
      viewedAt: d.viewedAt?.toISOString(),
    })),
    activities: lead.activities.map((a) => ({
      id: a.id,
      type: a.type,
      message: a.message,
      createdAt: a.createdAt.toISOString(),
      authorName: a.authorName,
    })),
    agentId: lead.agentId || undefined,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  };
}

export type LeadHttpDto = ReturnType<typeof mapLeadToHttp>;
