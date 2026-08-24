import type {
  AgentProfile,
  DocumentFile,
  IntegrationSettings,
  NotificationSettings,
  PrivacySettings,
  SettingsState,
  SystemSettings,
  TeamUser,
} from '../types';
import {
  ACCENT_STORAGE_KEY,
  DEFAULT_ACCENT_COLOR_ID,
  isValidAccentColor,
  persistAccentColorId,
  SETTINGS_STORAGE_KEY,
} from './accent-presets';
import { createDefaultSettingsState, mirrorLegalDocumentsToFiles } from './mock-data';

const STORAGE_KEY = SETTINGS_STORAGE_KEY;
const CHANGE_EVENT = 'imoveis-settings-changed';

let cache: SettingsState | null = null;
let hydratedFromStorage = false;
let clientBridgeReady = false;
let version = 0;

function cloneSeed(): SettingsState {
  return createDefaultSettingsState();
}

function ensureSeedCache(): void {
  if (!cache) cache = cloneSeed();
}

function normalizeSystem(system: Partial<SystemSettings> | undefined): SystemSettings {
  const seed = cloneSeed().system;
  const merged = { ...seed, ...system };
  return {
    ...merged,
    whatsappCatalogEnabled:
      typeof merged.whatsappCatalogEnabled === 'boolean'
        ? merged.whatsappCatalogEnabled
        : true,
    leadFormCatalogEnabled:
      typeof merged.leadFormCatalogEnabled === 'boolean'
        ? merged.leadFormCatalogEnabled
        : true,
    accentColorId: isValidAccentColor(merged.accentColorId)
      ? merged.accentColorId
      : DEFAULT_ACCENT_COLOR_ID,
  };
}

function isSettingsState(value: unknown): value is SettingsState {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    Boolean(record.profile) &&
    Array.isArray(record.documents) &&
    Boolean(record.privacy) &&
    Boolean(record.notifications)
  );
}

function cloneUsers(users: readonly TeamUser[]): TeamUser[] {
  return users.map((user) => ({
    ...user,
    permissions: { ...user.permissions },
    mustChangePassword: user.mustChangePassword ?? false,
    temporaryPassword: user.temporaryPassword,
  }));
}

function cloneIntegrations(integrations: IntegrationSettings): IntegrationSettings {
  return {
    whatsapp: { ...integrations.whatsapp },
    olx: { ...integrations.olx },
    zap: { ...integrations.zap },
    'google-calendar': { ...integrations['google-calendar'] },
    'meta-ads': { ...integrations['meta-ads'] },
    asaas: { ...integrations.asaas },
  };
}

function migrateSettingsState(value: unknown): SettingsState | null {
  if (!value || typeof value !== 'object') return null;
  const seed = cloneSeed();
  const record = value as Record<string, unknown>;
  if (!record.profile || !Array.isArray(record.documents)) return null;

  const profile = record.profile as AgentProfile;
  const documents = record.documents as DocumentFile[];
  const nextProfile: AgentProfile = {
    ...seed.profile,
    ...profile,
    id: profile.id || seed.profile.id,
    legalDocuments: (profile.legalDocuments ?? seed.profile.legalDocuments).map(
      (doc) => ({ ...doc }),
    ),
  };

  return {
    profile: nextProfile,
    documents: mirrorLegalDocumentsToFiles(
      nextProfile.legalDocuments,
      documents.map((doc) => ({ ...doc })),
    ),
    privacy: isSettingsState(value)
      ? {
          ...(value as SettingsState).privacy,
          sessions: (value as SettingsState).privacy.sessions.map((s) => ({ ...s })),
        }
      : seed.privacy,
    notifications: isSettingsState(value)
      ? { ...(value as SettingsState).notifications }
      : seed.notifications,
    users: isSettingsState(value) && Array.isArray((value as SettingsState).users)
      ? cloneUsers((value as SettingsState).users)
      : cloneUsers(seed.users),
    integrations: isSettingsState(value) && (value as SettingsState).integrations
      ? cloneIntegrations((value as SettingsState).integrations)
      : cloneIntegrations(seed.integrations),
    system: normalizeSystem(
      record.system && typeof record.system === 'object'
        ? (record.system as Partial<SystemSettings>)
        : seed.system,
    ),
  };
}

function readStorage(): SettingsState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return migrateSettingsState(parsed);
  } catch {
    return null;
  }
}

function writeStorage(state: SettingsState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (isValidAccentColor(state.system.accentColorId)) {
      persistAccentColorId(state.system.accentColorId);
    }
  } catch {
    // Quota / private mode — keep in-memory only.
  }
}

function withPersistedAccent(state: SettingsState): SettingsState {
  if (typeof window === 'undefined') return state;
  try {
    const quick = window.localStorage.getItem(ACCENT_STORAGE_KEY);
    if (!isValidAccentColor(quick) || quick === state.system.accentColorId) {
      return state;
    }
    return {
      ...state,
      system: normalizeSystem({ ...state.system, accentColorId: quick }),
    };
  } catch {
    return state;
  }
}

function notifyChange(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function commit(next: SettingsState): SettingsState {
  cache = next;
  writeStorage(next);
  version += 1;
  notifyChange();
  return next;
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
  const base = fromStorage ?? cloneSeed();
  cache = withPersistedAccent(base);
  hydratedFromStorage = true;
  if (!fromStorage) {
    writeStorage(cache);
  } else if (cache.system.accentColorId !== fromStorage.system.accentColorId) {
    // Accent dedicado divergiu — realinha o blob de settings.
    writeStorage(cache);
  }
}

export function isSettingsHydratedFromStorage(): boolean {
  return typeof window !== 'undefined' && clientBridgeReady && hydratedFromStorage;
}

/** Garante leitura do localStorage antes de mutar (evita commit em cima do seed). */
function prepareClientMutation(): void {
  if (typeof window === 'undefined') return;
  if (!clientBridgeReady) {
    clientBridgeReady = true;
    hydratedFromStorage = false;
    cache = null;
  }
  ensureHydrated();
}

export function getSettingsState(): SettingsState {
  ensureHydrated();
  return cache ?? cloneSeed();
}

export function getProfileFromStore(): AgentProfile {
  return getSettingsState().profile;
}

export function getDocumentsFromStore(): readonly DocumentFile[] {
  return getSettingsState().documents;
}

export function getPrivacyFromStore(): PrivacySettings {
  return getSettingsState().privacy;
}

export function getNotificationsFromStore(): NotificationSettings {
  return getSettingsState().notifications;
}

export function getUsersFromStore(): readonly TeamUser[] {
  return getSettingsState().users;
}

export function getIntegrationsFromStore(): IntegrationSettings {
  return getSettingsState().integrations;
}

export function getSystemFromStore(): SystemSettings {
  return getSettingsState().system;
}

export function saveProfile(profile: AgentProfile): AgentProfile {
  prepareClientMutation();
  const current = cache ?? cloneSeed();
  const nextProfile = {
    ...profile,
    legalDocuments: profile.legalDocuments.map((doc) => ({ ...doc })),
  };
  const next = commit({
    ...current,
    profile: nextProfile,
    documents: mirrorLegalDocumentsToFiles(nextProfile.legalDocuments, current.documents),
  });
  return next.profile;
}

export function resetProfileToSeed(): AgentProfile {
  const seed = cloneSeed();
  return saveProfile(seed.profile);
}

export function saveDocuments(documents: readonly DocumentFile[]): readonly DocumentFile[] {
  prepareClientMutation();
  const current = cache ?? cloneSeed();
  const next = commit({
    ...current,
    documents: documents.map((doc) => ({ ...doc })),
  });
  return next.documents;
}

export function savePrivacy(privacy: PrivacySettings): PrivacySettings {
  prepareClientMutation();
  const current = cache ?? cloneSeed();
  const next = commit({
    ...current,
    privacy: {
      ...privacy,
      sessions: privacy.sessions.map((session) => ({ ...session })),
    },
  });
  return next.privacy;
}

export function saveNotifications(
  notifications: NotificationSettings,
): NotificationSettings {
  prepareClientMutation();
  const current = cache ?? cloneSeed();
  const next = commit({
    ...current,
    notifications: { ...notifications },
  });
  return next.notifications;
}

export function saveUsers(users: readonly TeamUser[]): readonly TeamUser[] {
  prepareClientMutation();
  const current = cache ?? cloneSeed();
  const next = commit({
    ...current,
    users: cloneUsers(users),
  });
  return next.users;
}

export function saveIntegrations(integrations: IntegrationSettings): IntegrationSettings {
  prepareClientMutation();
  const current = cache ?? cloneSeed();
  const next = commit({
    ...current,
    integrations: cloneIntegrations(integrations),
  });
  return next.integrations;
}

export function saveSystem(system: SystemSettings): SystemSettings {
  prepareClientMutation();
  const current = cache ?? cloneSeed();
  const next = commit({
    ...current,
    system: normalizeSystem(system),
  });
  return next.system;
}

export function getSettingsVersion(): number {
  ensureHydrated();
  return version;
}

/** Subscribe para `useSyncExternalStore` — storage + mutações locais. */
export function subscribeSettings(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = () => onStoreChange();
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener('storage', handler);

  if (!clientBridgeReady) {
    queueMicrotask(() => {
      if (clientBridgeReady && hydratedFromStorage) return;
      clientBridgeReady = true;
      hydratedFromStorage = false;
      cache = null;
      ensureHydrated();
      version += 1;
      // Notifica **todos** os subscribers (não só o que enfileirou o microtask).
      notifyChange();
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
