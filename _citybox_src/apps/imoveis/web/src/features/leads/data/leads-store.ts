import {
  LEAD_PURPOSE_LABEL,
  type ContactLeadDetail,
  type LeadPurpose,
  type LeadSource,
  type LeadStatus,
} from '../types';
import { PROPERTY_TYPE_LABEL, type PropertyType } from '@/features/shared/types';
import { CONTACT_LEADS } from './mock-data';

const STORAGE_KEY = 'imoveis.leads.v1';
const CHANGE_EVENT = 'imoveis-leads-changed';

let cache: ContactLeadDetail[] | null = null;
let hydratedFromStorage = false;
let clientBridgeReady = false;
let version = 0;

function cloneLead(lead: ContactLeadDetail): ContactLeadDetail {
  return {
    ...lead,
    agentIds: [...(lead.agentIds ?? [])],
    matchedProperties: [...(lead.matchedProperties ?? [])],
    documents: [...(lead.documents ?? [])],
    activities: [...(lead.activities ?? [])],
  };
}

function cloneSeed(): ContactLeadDetail[] {
  return CONTACT_LEADS.map(cloneLead);
}

function normalizeStoredLead(raw: ContactLeadDetail): ContactLeadDetail {
  return cloneLead({
    ...raw,
    agentIds: raw.agentIds ?? [],
    documents: raw.documents ?? [],
    activities: raw.activities ?? [],
    matchedProperties: raw.matchedProperties ?? [],
  });
}

function ensureSeedCache(): void {
  if (!cache) cache = cloneSeed();
}

function readStorage(): ContactLeadDetail[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed as ContactLeadDetail[];
  } catch {
    return null;
  }
}

function writeStorage(leads: readonly ContactLeadDetail[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  } catch {
    // Quota / private mode — keep in-memory only.
  }
}

function notifyChange(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * SSR e primeiro paint do client usam só o seed.
 * localStorage só entra depois do `subscribe` (pós-hidratação).
 */
export function ensureHydrated(): void {
  if (typeof window === 'undefined' || !clientBridgeReady) {
    ensureSeedCache();
    return;
  }
  if (hydratedFromStorage && cache) return;
  const fromStorage = readStorage();
  cache = fromStorage ? fromStorage.map(normalizeStoredLead) : cloneSeed();
  hydratedFromStorage = true;
  if (!fromStorage) {
    writeStorage(cache);
  }
}

export function getAllLeads(): readonly ContactLeadDetail[] {
  ensureHydrated();
  return cache ?? cloneSeed();
}

export function getLeadByIdFromStore(id: string): ContactLeadDetail | null {
  return getAllLeads().find((lead) => lead.id === id) ?? null;
}

export function upsertLead(lead: ContactLeadDetail): ContactLeadDetail {
  ensureHydrated();
  const current = cache ?? cloneSeed();
  const index = current.findIndex((item) => item.id === lead.id);
  const next =
    index >= 0
      ? current.map((item, i) => (i === index ? lead : item))
      : [lead, ...current];
  cache = next;
  writeStorage(next);
  version += 1;
  notifyChange();
  return lead;
}

export function removeLead(id: string): boolean {
  ensureHydrated();
  const current = cache ?? cloneSeed();
  const next = current.filter((lead) => lead.id !== id);
  if (next.length === current.length) return false;
  cache = next;
  writeStorage(next);
  version += 1;
  notifyChange();
  return true;
}

/** Sincroniza clientes do corretor: selecionados ficam com `agentId`; os que eram dele e saíram vão para `fallbackAgentId`. */
export function syncLeadsForAgent(
  agentId: string,
  selectedIds: readonly string[],
  fallbackAgentId: string,
): void {
  ensureHydrated();
  const selected = new Set(selectedIds);
  const current = cache ?? cloneSeed();
  let changed = false;
  const next = current.map((item) => {
    if (selected.has(item.id)) {
      if (item.agentId === agentId) return item;
      changed = true;
      return { ...item, agentId };
    }
    if (item.agentId === agentId) {
      changed = true;
      return { ...item, agentId: fallbackAgentId };
    }
    return item;
  });
  if (!changed) return;
  cache = next;
  writeStorage(next);
  version += 1;
  notifyChange();
}

export function getLeadsVersion(): number {
  ensureHydrated();
  return version;
}

/** Subscribe para `useSyncExternalStore` — storage + mutações locais. */
export function subscribeLeads(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = () => onStoreChange();
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener('storage', handler);

  if (!clientBridgeReady) {
    queueMicrotask(() => {
      if (clientBridgeReady) return;
      clientBridgeReady = true;
      hydratedFromStorage = false;
      cache = null;
      ensureHydrated();
      version += 1;
      onStoreChange();
    });
  }

  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1]?.[0] ?? ''}`.toUpperCase();
}

export function buildIntent(type: PropertyType, purpose: LeadPurpose): string {
  return `${PROPERTY_TYPE_LABEL[type]} — ${LEAD_PURPOSE_LABEL[purpose]}`;
}

export type LeadWriteInput = {
  name: string;
  email: string;
  phone: string;
  status: LeadStatus;
  leadSource: LeadSource;
  interestedPropertyType: PropertyType;
  budgetRange: string;
  preferredLocation: string;
  purpose: LeadPurpose;
  latestFollowUp: string;
  nextFollowUp: string;
  notes: string;
  photoUrl?: string;
  propertyName?: string;
  hasSuggestion?: boolean;
  agentIds?: ContactLeadDetail['agentIds'];
  matchedProperties?: ContactLeadDetail['matchedProperties'];
  documents?: ContactLeadDetail['documents'];
  activities?: ContactLeadDetail['activities'];
  agentId?: string;
};

export function toContactLead(
  input: LeadWriteInput,
  existing?: ContactLeadDetail | null,
): ContactLeadDetail {
  const name = input.name.trim();
  const today = new Date().toISOString().slice(0, 10);
  const id = existing?.id ?? `lead-${crypto.randomUUID()}`;

  return {
    id,
    name,
    initials: initialsFromName(name),
    email: input.email.trim() || undefined,
    phone: input.phone.trim() || undefined,
    city: existing?.city,
    state: existing?.state,
    status: input.status,
    intent: buildIntent(input.interestedPropertyType, input.purpose),
    budgetLabel: input.budgetRange.trim() || existing?.budgetLabel || '—',
    lastContactedAt: existing?.lastContactedAt || today,
    propertyName: input.propertyName !== undefined
      ? input.propertyName.trim() || undefined
      : existing?.propertyName,
    hasSuggestion: input.hasSuggestion ?? existing?.hasSuggestion,
    photoUrl: input.photoUrl !== undefined ? input.photoUrl || undefined : existing?.photoUrl,
    leadSource: input.leadSource,
    interestedPropertyType: input.interestedPropertyType,
    budgetRange: input.budgetRange.trim(),
    preferredLocation: input.preferredLocation.trim(),
    purpose: input.purpose,
    latestFollowUp: input.latestFollowUp || existing?.latestFollowUp || today,
    nextFollowUp: input.nextFollowUp,
    notes: input.notes,
    agentIds: [...(input.agentIds ?? existing?.agentIds ?? [])],
    matchedProperties: [...(input.matchedProperties ?? existing?.matchedProperties ?? [])],
    documents: [...(input.documents ?? existing?.documents ?? [])],
    activities: [...(input.activities ?? existing?.activities ?? [])],
    agentId: input.agentId ?? existing?.agentId,
  };
}
