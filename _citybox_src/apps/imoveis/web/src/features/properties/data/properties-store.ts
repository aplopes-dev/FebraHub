import type { Person, PropertyStatus, PropertyType } from '@/features/shared/types';
import type { ListingType, PropertyDocument, PropertyListing } from '../types';
import { PROPERTY_LISTINGS } from './mock-data';

const STORAGE_KEY = 'imoveis.properties.v1';
const CHANGE_EVENT = 'imoveis-properties-changed';

let cache: PropertyListing[] | null = null;
/** true depois que o client aplicou localStorage (pós-hidratação React). */
let hydratedFromStorage = false;
/** false no SSR e no 1º paint — evita mismatch seed vs localStorage. */
let clientBridgeReady = false;
let version = 0;

function cloneSeed(): PropertyListing[] {
  return PROPERTY_LISTINGS.map((item) => ({
    ...item,
    activeLeads: [...item.activeLeads],
    photoUrls: [...item.photoUrls],
    documents: [...item.documents],
  }));
}

function ensureSeedCache(): void {
  if (!cache) cache = cloneSeed();
}

function readStorage(): PropertyListing[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed as PropertyListing[];
  } catch {
    return null;
  }
}

function writeStorage(items: readonly PropertyListing[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Quota / private mode
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
  cache = fromStorage ?? cloneSeed();
  hydratedFromStorage = true;
  if (!fromStorage) {
    writeStorage(cache);
  }
}

export function getAllProperties(): readonly PropertyListing[] {
  ensureHydrated();
  return cache ?? cloneSeed();
}

export function getPropertyByIdFromStore(id: string): PropertyListing | null {
  return getAllProperties().find((item) => item.id === id) ?? null;
}

export function upsertProperty(property: PropertyListing): PropertyListing {
  ensureHydrated();
  const current = cache ?? cloneSeed();
  const index = current.findIndex((item) => item.id === property.id);
  const next =
    index >= 0
      ? current.map((item, i) => (i === index ? property : item))
      : [property, ...current];
  cache = next;
  writeStorage(next);
  version += 1;
  notifyChange();
  return property;
}

export function removeProperty(id: string): boolean {
  ensureHydrated();
  const current = cache ?? cloneSeed();
  const next = current.filter((item) => item.id !== id);
  if (next.length === current.length) return false;
  cache = next;
  writeStorage(next);
  version += 1;
  notifyChange();
  return true;
}

/** Sincroniza o catálogo do corretor: selecionados ficam com `agentId`; os que eram dele e saíram vão para `fallbackAgentId`. */
export function syncPropertiesForAgent(
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

export function getPropertiesVersion(): number {
  ensureHydrated();
  return version;
}

export function subscribeProperties(onStoreChange: () => void): () => void {
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

export type PropertyWriteInput = {
  name: string;
  city: string;
  state: string;
  type: PropertyType;
  units: number;
  cost: number;
  status: PropertyStatus;
  occupiedUnits?: number;
  listingType: ListingType;
  negotiable: boolean;
  bedrooms: number;
  floors: number;
  sizeSqm: number;
  yearBuilt: number;
  address: string;
  country: string;
  zipCode: string;
  mapCoordinate: string;
  typeCode?: string;
  photoUrls: readonly string[];
  documents: readonly PropertyDocument[];
  views?: number;
  activeLeads?: readonly Person[];
  totalActiveLeads?: number;
  agentId?: string;
};

export function toPropertyListing(
  input: PropertyWriteInput,
  existing?: PropertyListing | null,
): PropertyListing {
  const name = input.name.trim();
  const id = existing?.id ?? `lst-${crypto.randomUUID()}`;

  return {
    id,
    name,
    city: input.city.trim(),
    state: input.state.trim().toUpperCase().slice(0, 2),
    type: input.type,
    units: Math.max(0, input.units),
    cost: Math.max(0, input.cost),
    views: input.views ?? existing?.views ?? 0,
    status: input.status,
    occupiedUnits:
      input.status === 'occupied'
        ? (input.occupiedUnits ?? existing?.occupiedUnits ?? 0)
        : undefined,
    activeLeads: [...(input.activeLeads ?? existing?.activeLeads ?? [])],
    totalActiveLeads: input.totalActiveLeads ?? existing?.totalActiveLeads ?? 0,
    listingType: input.listingType,
    negotiable: input.negotiable,
    bedrooms: Math.max(0, input.bedrooms),
    floors: Math.max(0, input.floors),
    sizeSqm: Math.max(0, input.sizeSqm),
    yearBuilt: input.yearBuilt,
    address: input.address.trim(),
    country: input.country.trim() || 'Brasil',
    zipCode: input.zipCode.trim(),
    mapCoordinate: input.mapCoordinate.trim(),
    typeCode: input.typeCode?.trim() || undefined,
    photoUrls: [...input.photoUrls],
    documents: [...input.documents],
    agentId: input.agentId ?? existing?.agentId,
  };
}
