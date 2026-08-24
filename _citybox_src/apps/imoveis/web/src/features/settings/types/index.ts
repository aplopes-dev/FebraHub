/** Tipos da feature de configurações (perfil do corretor + documentos). */

import type { AccentColorValue } from '../data/accent-presets';
import {
  PERMISSION_KEYS,
  booleanPermissionsForRole,
  createEmptyBooleanMap,
  type PermissionBooleanMap,
  type PermissionKey,
  type ImovelRoleKey,
} from '@citybox/imoveis-permissions';

export type SettingsSection =
  | 'profile'
  | 'privacy'
  | 'notifications'
  | 'users'
  | 'system'
  | 'billing'
  | 'delete-account';

export type ProfileTab =
  | 'info'
  | 'properties'
  | 'clients'
  | 'documents';

export type LegalDocKind = 'license' | 'employment' | 'insurance';

export type LegalDocument = {
  kind: LegalDocKind;
  name: string;
  sizeLabel: string;
  /** data URL ou vazio = slot de upload (mock legado). */
  fileUrl?: string;
  /** Path relativo autenticado da API (`/v1/settings/profile/…`). */
  path?: string;
};

export type AgentProfile = {
  /** Id estável do corretor (escopo de imóveis/clientes). */
  id: string;
  name: string;
  role: string;
  initials: string;
  email: string;
  phone: string;
  region: string;
  /** CRECI / State ID. */
  stateId: string;
  taxId: string;
  photoUrl?: string;
  legalDocuments: readonly LegalDocument[];
  /** Integração Google Calendar (por corretor). */
  googleCalendar?: {
    connected: boolean;
    enabled: boolean;
    calendarId: string;
  };
};

export type GoogleCalendarIntegrationStatus = {
  connected: boolean;
  enabled: boolean;
  calendarId: string;
  /** Env GOOGLE_* configurada na API. */
  configured: boolean;
};

export type DocumentFolderId =
  | 'client'
  | 'property'
  | 'legal'
  | 'signed';

export type DocumentFolder = {
  id: DocumentFolderId;
  label: string;
};

export type DocumentFileStatus = 'pending' | 'completed' | 'archived';

export type DocumentFile = {
  id: string;
  name: string;
  folderId: DocumentFolderId;
  /** ISO date YYYY-MM-DD. */
  addedAt: string;
  sizeLabel: string;
  detailsLabel: string;
  status: DocumentFileStatus;
  /** Espelho de documento legal do perfil — upsert idempotente. */
  /** linked-* = documentos de lead/imóvel (somente leitura nesta aba). */
  source?: 'profile-legal' | 'manual' | 'linked-lead' | 'linked-property';
  legalKind?: LegalDocKind;
  /** Download autenticado (`/v1/settings/profile/…/documents/:id`). */
  path?: string;
};

export type BillingSettings = {
  planName: string;
  status: 'active' | 'past_due' | 'canceled';
  renewsAt: string | null;
  amountCents: number;
};

export type DocumentsSummary = {
  allFolders: number;
  pending: number;
  completed: number;
  archived: number;
};

export type DeviceSession = {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
};

export type PrivacySettings = {
  twoFactorEnabled: boolean;
  sessions: readonly DeviceSession[];
};

export type NotificationSettings = {
  emailEnabled: boolean;
  pushEnabled: boolean;
  leadsAlerts: boolean;
  calendarAlerts: boolean;
  documentsAlerts: boolean;
};

export type { PermissionKey };

export type UserPermissions = PermissionBooleanMap;

export type UserRole = 'admin' | 'broker' | 'affiliated' | 'assistant';

export type TeamUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  initials: string;
  /** Usuário pode acessar o painel. */
  active: boolean;
  permissions: UserPermissions;
  /** ISO date YYYY-MM-DD do último acesso (mock). */
  lastAccessAt?: string;
  /**
   * Senha provisória gerada no create (mock).
   * Limpa após a primeira troca de senha.
   */
  temporaryPassword?: string;
  /** Exige troca de senha no primeiro login (mock). */
  mustChangePassword: boolean;
};

export type IntegrationKey =
  | 'whatsapp'
  | 'olx'
  | 'zap'
  | 'google-calendar'
  | 'meta-ads'
  | 'asaas';

export type IntegrationSettings = Record<
  IntegrationKey,
  {
    enabled: boolean;
    connected: boolean;
    accountLabel?: string;
  }
>;

export type SystemSettings = {
  companyName: string;
  timezone: string;
  currency: string;
  language: string;
  autoAssignLeads: boolean;
  requireTwoFactorForNewUsers: boolean;
  /** Catálogo público: botão de WhatsApp na página do imóvel. */
  whatsappCatalogEnabled: boolean;
  /** Catálogo público: formulário de captação na página do imóvel. */
  leadFormCatalogEnabled: boolean;
  /** Preset (`orange`, …) ou hex customizado (`#RRGGBB`) — tokens `--primary*` no `<html>`. */
  accentColorId: AccentColorValue;
};

export type SettingsState = {
  profile: AgentProfile;
  documents: readonly DocumentFile[];
  privacy: PrivacySettings;
  notifications: NotificationSettings;
  users: readonly TeamUser[];
  integrations: IntegrationSettings;
  system: SystemSettings;
};

export const SETTINGS_SECTION_LABEL: Record<SettingsSection, string> = {
  profile: 'Meu perfil',
  privacy: 'Privacidade e segurança',
  notifications: 'Notificações',
  users: 'Usuários',
  system: 'Configurações de sistema',
  billing: 'Assinatura e cobrança',
  'delete-account': 'Excluir conta',
};

export const PROFILE_TAB_LABEL: Record<ProfileTab, string> = {
  info: 'Informações',
  properties: 'Imóveis',
  clients: 'Clientes',
  documents: 'Documentos',
};

export const LEGAL_DOC_LABEL: Record<LegalDocKind, string> = {
  license: 'Licença de corretor',
  employment: 'Contrato de trabalho',
  insurance: 'Comprovante de seguro (E&O)',
};

export { PERMISSION_KEYS };

export const PERMISSION_LABEL: Record<PermissionKey, string> = {
  leads: 'Leads e clientes',
  properties: 'Imóveis',
  calendar: 'Agenda',
  transactions: 'Negócios',
  finance: 'Financeiro',
  settings: 'Configurações',
  users: 'Usuários',
  billing: 'Assinatura e cobrança',
  integrations: 'Integrações',
};

export const USER_ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Administrador',
  broker: 'Administrador/Corretor',
  affiliated: 'Corretor filiado',
  assistant: 'Assistente',
};

export const INTEGRATION_LABEL: Record<IntegrationKey, string> = {
  whatsapp: 'WhatsApp Business',
  olx: 'OLX Imóveis',
  zap: 'ZAP Imóveis',
  'google-calendar': 'Google Calendar',
  'meta-ads': 'Meta Ads',
  asaas: 'Asaas (pagamentos)',
};

export const INTEGRATION_DESCRIPTION: Record<IntegrationKey, string> = {
  whatsapp: 'Atendimento e follow-up de leads pelo WhatsApp.',
  olx: 'Publicação e sincronização de anúncios na OLX.',
  zap: 'Publicação e sincronização de anúncios no ZAP.',
  'google-calendar': 'Sincronize compromissos com o Google Calendar.',
  'meta-ads': 'Importe leads de campanhas do Facebook e Instagram.',
  asaas: 'Cobranças e recebimentos via Asaas.',
};

export function createDefaultPermissions(
  overrides: Partial<UserPermissions> = {},
): UserPermissions {
  return { ...createEmptyBooleanMap(), ...overrides };
}

/** Gera senha provisória legível para o mock (ex.: `Imv-a7Kx9Q`). */
export function generateTemporaryPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let suffix = '';
  for (const byte of bytes) {
    suffix += alphabet[byte % alphabet.length];
  }
  return `Imv-${suffix}`;
}

export function permissionsForRole(role: UserRole): UserPermissions {
  return booleanPermissionsForRole(role as ImovelRoleKey);
}
