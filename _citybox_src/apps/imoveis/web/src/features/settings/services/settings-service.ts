/**
 * Settings — fonte de dados via imoveis-api (`/v1/settings/*`).
 * Store local (`settings-store`) só espelha accent para tema SSR.
 */
import { imoveisFetch, imoveisUpload } from '@/lib/imoveis-api';
import { CURRENT_AGENT_ID } from '@/features/shared/constants/agents';
import { DOCUMENT_FOLDERS } from '../data/mock-data';
import {
  getSystemFromStore,
  initialsFromName,
  saveSystem,
} from '../data/settings-store';
import { getSessionUserId, setSessionUserId } from '../data/session-store';
import {
  getTeamMembersCache,
  isTeamCacheLoaded,
  setTeamMembersCache,
} from '../data/team-members-cache';
import { DEFAULT_USERS } from '../data/mock-data';
import type {
  AgentProfile,
  BillingSettings,
  DocumentFile,
  DocumentFileStatus,
  DocumentFolder,
  DocumentFolderId,
  DocumentsSummary,
  IntegrationKey,
  IntegrationSettings,
  LegalDocKind,
  LegalDocument,
  NotificationSettings,
  PrivacySettings,
  SystemSettings,
  TeamUser,
  UserPermissions,
  UserRole,
  GoogleCalendarIntegrationStatus,
} from '../types';
import { permissionsForRole } from '../types';
import { parseAccentColorId } from '../data/accent-presets';

export type StoreSettingsPayload = {
  system: SystemSettings;
  notifications: NotificationSettings;
  integrations: IntegrationSettings;
};

export type AgentProfileWriteInput = {
  name: string;
  role: string;
  email: string;
  phone: string;
  region: string;
  stateId: string;
  taxId: string;
};

export type UserWriteInput = {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  active: boolean;
  permissions: UserPermissions;
};

export type CreateUserResult = {
  user: TeamUser;
  credentials: { login: string; temporaryPassword: string };
};

export function listDocumentFolders(): readonly DocumentFolder[] {
  return DOCUMENT_FOLDERS;
}

export function defaultPermissionsForRole(role: UserRole): UserPermissions {
  return permissionsForRole(role);
}

export function getSystemSettings(): SystemSettings {
  return getSystemFromStore();
}

export function updateSystemSettings(input: SystemSettings): SystemSettings {
  return saveSystem({ ...input });
}

export { setTeamMembersCache };

export function getCurrentSessionUser(): TeamUser | null {
  const id = getSessionUserId();
  const members = getTeamMembersCache();
  const fromCache = members.find((u) => u.id === id && u.active);
  if (fromCache) return fromCache;

  if (!isTeamCacheLoaded()) {
    const fallback =
      DEFAULT_USERS.find((u) => u.id === id && u.active) ??
      DEFAULT_USERS.find((u) => u.id === CURRENT_AGENT_ID);
    return fallback
      ? { ...fallback, permissions: { ...fallback.permissions } }
      : null;
  }

  // Não caia no mock `ana-helena` se o id real da sessão não estiver na equipe
  // (ex.: admin-citybox/lojista-citybox) — evita badge/papel invertido.
  return null;
}

export function loginAsUser(userId: string): TeamUser | null {
  const user = getTeamMembersCache().find((u) => u.id === userId && u.active);
  if (!user) return null;
  setSessionUserId(userId);
  return user;
}

export function formatHeaderDisplayName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const lastInitial = parts[parts.length - 1]?.[0] ?? '';
  return lastInitial ? `${first} ${lastInitial}.` : first;
}

/* ---- HTTP mappers ---- */

type StoreSettingsHttp = {
  system: Omit<
    SystemSettings,
    'accentColorId' | 'whatsappCatalogEnabled' | 'leadFormCatalogEnabled'
  > & {
    accentColorId: string;
    whatsappCatalogEnabled?: boolean;
    leadFormCatalogEnabled?: boolean;
  };
  notifications: NotificationSettings;
  integrations: IntegrationSettings;
};

type AgentProfileHttp = {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  region: string;
  stateId: string;
  taxId: string;
  photoUrl?: string;
  legalDocuments: readonly {
    kind: LegalDocKind;
    name: string;
    sizeLabel: string;
    path?: string;
  }[];
  googleCalendar?: {
    connected: boolean;
    enabled: boolean;
    calendarId: string;
  };
};

type PrivacyHttp = {
  twoFactorEnabled: boolean;
  sessions: readonly {
    id: string;
    device: string;
    location: string;
    lastActiveLabel: string;
    isCurrent: boolean;
  }[];
};

type DocumentHttp = {
  id: string;
  folderId: string;
  name: string;
  status: string;
  sizeLabel: string;
  detailsLabel: string;
  source: string;
  legalKind: string | null;
  hasFile: boolean;
  mimeType?: string | null;
  addedAt: string;
  path?: string;
};

type TeamMemberHttp = TeamUser & {
  temporaryPassword?: string | null;
  provisionalPassword?: string | null;
};

function profilePath(agentId: string, suffix = ''): string {
  return `/v1/settings/profile/${encodeURIComponent(agentId)}${suffix}`;
}

function mapStoreSettings(payload: StoreSettingsHttp): StoreSettingsPayload {
  return {
    system: {
      ...payload.system,
      whatsappCatalogEnabled:
        typeof payload.system.whatsappCatalogEnabled === 'boolean'
          ? payload.system.whatsappCatalogEnabled
          : true,
      leadFormCatalogEnabled:
        typeof payload.system.leadFormCatalogEnabled === 'boolean'
          ? payload.system.leadFormCatalogEnabled
          : true,
      accentColorId: parseAccentColorId(payload.system.accentColorId),
    },
    notifications: { ...payload.notifications },
    integrations: { ...payload.integrations },
  };
}

function mapAgentProfile(payload: AgentProfileHttp): AgentProfile {
  return {
    id: payload.id,
    name: payload.name,
    role: payload.role,
    initials: initialsFromName(payload.name),
    email: payload.email,
    phone: payload.phone,
    region: payload.region,
    stateId: payload.stateId,
    taxId: payload.taxId,
    photoUrl: payload.photoUrl || undefined,
    legalDocuments: payload.legalDocuments.map((doc) => ({ ...doc })),
    googleCalendar: payload.googleCalendar
      ? {
          connected: Boolean(payload.googleCalendar.connected),
          enabled: Boolean(payload.googleCalendar.enabled),
          calendarId: payload.googleCalendar.calendarId || 'primary',
        }
      : undefined,
  };
}

function mapPrivacy(payload: PrivacyHttp): PrivacySettings {
  return {
    twoFactorEnabled: payload.twoFactorEnabled,
    sessions: payload.sessions.map((s) => ({
      id: s.id,
      device: s.device,
      location: s.location,
      lastActive: s.lastActiveLabel,
      isCurrent: s.isCurrent,
    })),
  };
}

function mapDocumentSource(source: string): DocumentFile['source'] {
  if (source === 'profile-legal' || source === 'profile_legal') {
    return 'profile-legal';
  }
  if (source === 'linked-lead') return 'linked-lead';
  if (source === 'linked-property') return 'linked-property';
  return 'manual';
}

function mapDocument(d: DocumentHttp, agentId: string): DocumentFile {
  const source = mapDocumentSource(d.source);
  const path =
    d.path?.trim() ||
    (d.hasFile
      ? `/v1/settings/profile/${encodeURIComponent(agentId)}/documents/${d.id}`
      : undefined);

  return {
    id: d.id,
    folderId: d.folderId as DocumentFolderId,
    name: d.name,
    addedAt: d.addedAt.slice(0, 10),
    sizeLabel: d.sizeLabel,
    detailsLabel: d.detailsLabel,
    status: d.status as DocumentFileStatus,
    source,
    legalKind: (d.legalKind as LegalDocKind) || undefined,
    path,
  };
}

function mapTeamMember(m: TeamMemberHttp): TeamUser {
  return {
    id: m.id,
    name: m.name,
    email: m.email,
    phone: m.phone,
    role: m.role,
    initials: m.initials,
    active: m.active,
    permissions: { ...m.permissions },
    lastAccessAt: m.lastAccessAt ?? undefined,
    temporaryPassword: m.temporaryPassword ?? undefined,
    mustChangePassword: m.mustChangePassword,
  };
}

/* ---- Store ---- */

export async function getStoreSettings(): Promise<StoreSettingsPayload> {
  const res = await imoveisFetch<{ data: StoreSettingsHttp }>('/v1/settings/store');
  return mapStoreSettings(res.data);
}

export async function putStoreSettings(
  input: StoreSettingsPayload,
): Promise<StoreSettingsPayload> {
  const res = await imoveisFetch<{ data: StoreSettingsHttp }>('/v1/settings/store', {
    method: 'PUT',
    body: JSON.stringify({
      system: { ...input.system, companyName: input.system.companyName.trim() },
      notifications: input.notifications,
      integrations: input.integrations,
    }),
  });
  return mapStoreSettings(res.data);
}

/** Preferências de notificação — qualquer membro da loja (sem Settings). */
export async function putStoreNotifications(
  notifications: NotificationSettings,
): Promise<StoreSettingsPayload> {
  const res = await imoveisFetch<{ data: StoreSettingsHttp }>(
    '/v1/settings/store/notifications',
    {
      method: 'PUT',
      body: JSON.stringify(notifications),
    },
  );
  return mapStoreSettings(res.data);
}

/* ---- Billing ---- */

export async function getBillingSettings(): Promise<BillingSettings> {
  const res = await imoveisFetch<{ data: BillingSettings }>('/v1/settings/billing');
  return res.data;
}

/* ---- Profile ---- */

export async function getAgentProfile(agentId: string): Promise<AgentProfile> {
  const res = await imoveisFetch<{ data: AgentProfileHttp }>(profilePath(agentId));
  return mapAgentProfile(res.data);
}

export async function putAgentProfile(
  agentId: string,
  input: AgentProfileWriteInput,
): Promise<AgentProfile> {
  const res = await imoveisFetch<{ data: AgentProfileHttp }>(profilePath(agentId), {
    method: 'PUT',
    body: JSON.stringify({
      name: input.name.trim(),
      role: input.role.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      region: input.region.trim(),
      stateId: input.stateId.trim(),
      taxId: input.taxId.trim(),
    }),
  });
  return mapAgentProfile(res.data);
}

/* ---- Google Calendar (per agent) ---- */

const GOOGLE_CALENDAR_PATH = '/v1/users/me/integrations/google-calendar';

export async function getGoogleCalendarStatus(): Promise<GoogleCalendarIntegrationStatus> {
  const res = await imoveisFetch<{ data: GoogleCalendarIntegrationStatus }>(
    GOOGLE_CALENDAR_PATH,
  );
  return res.data;
}

export async function getGoogleCalendarAuthUrl(): Promise<{ url: string }> {
  const res = await imoveisFetch<{ data: { url: string; configured: boolean } }>(
    `${GOOGLE_CALENDAR_PATH}/auth-url`,
  );
  return { url: res.data.url };
}

/** Reenvia ao Google os compromissos locais sem `googleEventId`. */
export async function syncPendingGoogleCalendar(): Promise<{ synced: number }> {
  const res = await imoveisFetch<{ data: { synced: number } }>(
    `${GOOGLE_CALENDAR_PATH}/sync`,
    { method: 'POST' },
  );
  return res.data;
}

export async function disconnectGoogleCalendar(): Promise<void> {
  await imoveisFetch<void>(GOOGLE_CALENDAR_PATH, { method: 'DELETE' });
}

export async function uploadAgentPhoto(
  agentId: string,
  file: File,
): Promise<AgentProfile> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await imoveisUpload<{ data: AgentProfileHttp }>(
    profilePath(agentId, '/photo'),
    formData,
  );
  return mapAgentProfile(res.data);
}

export async function deleteAgentPhoto(agentId: string): Promise<AgentProfile> {
  const res = await imoveisFetch<{ data: AgentProfileHttp }>(
    profilePath(agentId, '/photo'),
    { method: 'DELETE' },
  );
  return mapAgentProfile(res.data);
}

export async function upsertLegalDocument(
  agentId: string,
  kind: LegalDocKind,
  file: File,
): Promise<AgentProfile> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', file.name);
  const res = await imoveisUpload<{ data: AgentProfileHttp }>(
    profilePath(agentId, `/legal-documents/${kind}`),
    formData,
    { method: 'PUT' },
  );
  return mapAgentProfile(res.data);
}

export async function deleteLegalDocument(
  agentId: string,
  kind: LegalDocKind,
): Promise<AgentProfile> {
  const res = await imoveisFetch<{ data: AgentProfileHttp }>(
    profilePath(agentId, `/legal-documents/${kind}`),
    { method: 'DELETE' },
  );
  return mapAgentProfile(res.data);
}

/* ---- Privacy ---- */

export async function getAgentPrivacy(agentId: string): Promise<PrivacySettings> {
  const res = await imoveisFetch<{ data: PrivacyHttp }>(
    profilePath(agentId, '/privacy'),
  );
  return mapPrivacy(res.data);
}

export async function putAgentPrivacy(
  agentId: string,
  twoFactorEnabled: boolean,
): Promise<PrivacySettings> {
  const res = await imoveisFetch<{ data: PrivacyHttp }>(
    profilePath(agentId, '/privacy'),
    { method: 'PUT', body: JSON.stringify({ twoFactorEnabled }) },
  );
  return mapPrivacy(res.data);
}

export async function revokeAgentSession(
  agentId: string,
  sessionId: string,
): Promise<PrivacySettings> {
  await imoveisFetch(profilePath(agentId, `/sessions/${sessionId}`), {
    method: 'DELETE',
  });
  return getAgentPrivacy(agentId);
}

export async function changeAgentPassword(
  agentId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await imoveisFetch(profilePath(agentId, '/password'), {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

/* ---- Documents ---- */

export async function listAgentDocuments(
  agentId: string,
  folderId?: DocumentFolderId,
): Promise<readonly DocumentFile[]> {
  const qs = folderId ? `?folderId=${encodeURIComponent(folderId)}` : '';
  const res = await imoveisFetch<{ data: DocumentHttp[] }>(
    `${profilePath(agentId, '/documents')}${qs}`,
  );
  return res.data.map((d) => mapDocument(d, agentId));
}

export function summarizeDocuments(
  documents: readonly DocumentFile[],
): DocumentsSummary {
  return {
    allFolders: DOCUMENT_FOLDERS.length,
    pending: documents.filter((d) => d.status === 'pending').length,
    completed: documents.filter((d) => d.status === 'completed').length,
    archived: documents.filter((d) => d.status === 'archived').length,
  };
}

export async function uploadAgentFolderDocument(
  agentId: string,
  folderId: DocumentFolderId,
  file: File,
  options?: { detailsLabel?: string; status?: DocumentFileStatus },
): Promise<DocumentFile> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folderId', folderId);
  formData.append('name', file.name);
  if (options?.detailsLabel?.trim()) {
    formData.append('detailsLabel', options.detailsLabel.trim());
  }
  if (options?.status) {
    formData.append('status', options.status);
  }
  const res = await imoveisUpload<{ data: DocumentHttp }>(
    profilePath(agentId, '/documents'),
    formData,
  );
  return mapDocument(res.data, agentId);
}

export async function updateAgentFolderDocument(
  agentId: string,
  documentId: string,
  input: { detailsLabel?: string; status?: DocumentFileStatus },
): Promise<DocumentFile> {
  const res = await imoveisFetch<{ data: DocumentHttp }>(
    profilePath(agentId, `/documents/${encodeURIComponent(documentId)}`),
    { method: 'PATCH', body: JSON.stringify(input) },
  );
  return mapDocument(res.data, agentId);
}

export async function deleteAgentFolderDocument(
  agentId: string,
  documentId: string,
): Promise<void> {
  await imoveisFetch(profilePath(agentId, `/documents/${encodeURIComponent(documentId)}`), {
    method: 'DELETE',
  });
}

/* ---- Users ---- */

export async function listTeamMembers(): Promise<readonly TeamUser[]> {
  const res = await imoveisFetch<{ data: TeamMemberHttp[] }>('/v1/settings/users');
  const members = res.data.map(mapTeamMember);
  setTeamMembersCache(members);
  return members;
}

export async function createTeamMember(
  input: UserWriteInput,
): Promise<CreateUserResult> {
  const res = await imoveisFetch<{ data: TeamMemberHttp }>('/v1/settings/users', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      role: input.role,
      active: input.active,
      permissions: input.permissions,
    }),
  });
  const user = mapTeamMember(res.data);
  const temporaryPassword =
    res.data.provisionalPassword ?? res.data.temporaryPassword ?? '';
  return {
    user,
    credentials: { login: user.email, temporaryPassword },
  };
}

export async function updateTeamMember(
  agentId: string,
  input: UserWriteInput,
): Promise<TeamUser> {
  const res = await imoveisFetch<{ data: TeamMemberHttp }>(
    `/v1/settings/users/${encodeURIComponent(agentId)}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        name: input.name.trim(),
        email: input.email.trim(),
        phone: input.phone.trim(),
        role: input.role,
        active: input.active,
        permissions: input.permissions,
      }),
    },
  );
  return mapTeamMember(res.data);
}

export async function deleteTeamMember(agentId: string): Promise<void> {
  await imoveisFetch(`/v1/settings/users/${encodeURIComponent(agentId)}`, {
    method: 'DELETE',
  });
}

export async function completeFirstLoginPassword(
  agentId: string,
  newPassword: string,
): Promise<TeamUser> {
  const res = await imoveisFetch<{ data: TeamMemberHttp }>(
    `/v1/settings/users/${encodeURIComponent(agentId)}/complete-first-login`,
    { method: 'POST', body: JSON.stringify({ newPassword }) },
  );
  return mapTeamMember(res.data);
}
