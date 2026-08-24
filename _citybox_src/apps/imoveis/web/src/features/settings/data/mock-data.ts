/**
 * Dados mockados das configurações do corretor.
 * Seed alinhado ao header / catálogo público (Ana Helena Ribeiro).
 */
import type {
  AgentProfile,
  DocumentFile,
  DocumentFolder,
  IntegrationSettings,
  NotificationSettings,
  PrivacySettings,
  SettingsState,
  SystemSettings,
  TeamUser,
} from '../types';
import { LEGAL_DOC_LABEL, permissionsForRole } from '../types';
import { CURRENT_AGENT_ID } from '@/features/shared/constants/agents';

export const DEFAULT_PROFILE: AgentProfile = {
  id: CURRENT_AGENT_ID,
  name: 'Ana Helena Ribeiro',
  role: 'Corretora',
  initials: 'AH',
  email: 'ana.ribeiro@imoveis.com.br',
  phone: '(41) 99820-4417',
  region: 'Curitiba, PR',
  stateId: 'CRECI-PR 28.417',
  taxId: '12.345.678/0001-90',
  legalDocuments: [
    {
      kind: 'license',
      name: 'CRECI_AnaHelena_Licenca.pdf',
      sizeLabel: 'PDF · 14.5 MB',
      fileUrl: 'mock://license',
    },
    {
      kind: 'employment',
      name: 'Contrato_Emprego_AnaHelena.pdf',
      sizeLabel: 'PDF · 8.2 MB',
      fileUrl: 'mock://employment',
    },
    {
      kind: 'insurance',
      name: '',
      sizeLabel: '',
    },
  ],
};

export const DEFAULT_PRIVACY: PrivacySettings = {
  twoFactorEnabled: false,
  sessions: [
    {
      id: 'session-1',
      device: 'Chrome · Linux',
      location: 'Curitiba, BR',
      lastActive: 'Agora',
      isCurrent: true,
    },
    {
      id: 'session-2',
      device: 'Safari · iPhone',
      location: 'Curitiba, BR',
      lastActive: 'Há 2 dias',
      isCurrent: false,
    },
    {
      id: 'session-3',
      device: 'Chrome · Windows',
      location: 'São Paulo, BR',
      lastActive: 'Há 1 semana',
      isCurrent: false,
    },
  ],
};

export const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  emailEnabled: true,
  pushEnabled: true,
  leadsAlerts: true,
  calendarAlerts: true,
  documentsAlerts: false,
};

export const DEFAULT_USERS: readonly TeamUser[] = [
  {
    id: 'ana-helena',
    name: 'Ana Helena Ribeiro',
    email: 'ana.ribeiro@imoveis.com.br',
    phone: '(41) 99820-4417',
    role: 'admin',
    initials: 'AH',
    active: true,
    permissions: permissionsForRole('admin'),
    lastAccessAt: '2025-06-13',
    mustChangePassword: false,
  },
  {
    id: 'bruno-costa',
    name: 'Bruno Costa',
    email: 'bruno.costa@imoveis.com.br',
    phone: '(41) 99102-8831',
    role: 'broker',
    initials: 'BC',
    active: true,
    permissions: permissionsForRole('broker'),
    lastAccessAt: '2025-06-12',
    mustChangePassword: false,
  },
  {
    id: 'carla-mendes',
    name: 'Carla Mendes',
    email: 'carla.mendes@imoveis.com.br',
    phone: '(41) 99744-5510',
    role: 'assistant',
    initials: 'CM',
    active: true,
    permissions: permissionsForRole('assistant'),
    lastAccessAt: '2025-06-10',
    mustChangePassword: false,
  },
];

export const DEFAULT_INTEGRATIONS: IntegrationSettings = {
  whatsapp: { enabled: true, connected: true, accountLabel: '+55 41 99820-4417' },
  olx: { enabled: false, connected: false },
  zap: { enabled: true, connected: true, accountLabel: 'Ana Helena Imóveis' },
  'google-calendar': { enabled: true, connected: false },
  'meta-ads': { enabled: false, connected: false },
  asaas: { enabled: false, connected: false },
};

export const DEFAULT_SYSTEM: SystemSettings = {
  companyName: 'Ana Helena Imóveis',
  timezone: 'America/Sao_Paulo',
  currency: 'BRL',
  language: 'pt-BR',
  autoAssignLeads: false,
  requireTwoFactorForNewUsers: true,
  whatsappCatalogEnabled: true,
  leadFormCatalogEnabled: true,
  accentColorId: 'orange',
};

export const DOCUMENT_FOLDERS: readonly DocumentFolder[] = [
  { id: 'client', label: 'Documentos de clientes' },
  { id: 'property', label: 'Documentos de imóveis' },
  { id: 'legal', label: 'Conformidade legal' },
  { id: 'signed', label: 'Contratos' },
];

export const DOCUMENT_FILES: readonly DocumentFile[] = [
  {
    id: 'doc-1',
    name: 'SN_Confirmation_Letter_EmmaMartinez.pdf',
    folderId: 'client',
    addedAt: '2025-06-26',
    sizeLabel: '15 MB',
    detailsLabel: '8 páginas',
    status: 'completed',
    source: 'manual',
  },
  {
    id: 'doc-2',
    name: 'SN_Confirmation_Letter_EmmaMartinez.pdf',
    folderId: 'client',
    addedAt: '2025-06-25',
    sizeLabel: '15 MB',
    detailsLabel: '8 páginas',
    status: 'pending',
    source: 'manual',
  },
  {
    id: 'doc-3',
    name: 'SN_Confirmation_Letter_EmmaMartinez.pdf',
    folderId: 'property',
    addedAt: '2025-06-25',
    sizeLabel: '15 MB',
    detailsLabel: '8 páginas',
    status: 'completed',
    source: 'manual',
  },
  {
    id: 'doc-4',
    name: 'SN_Confirmation_Letter_EmmaMartinez.pdf',
    folderId: 'signed',
    addedAt: '2025-06-23',
    sizeLabel: '15 MB',
    detailsLabel: '8 páginas',
    status: 'pending',
    source: 'manual',
  },
  {
    id: 'doc-legal-license',
    name: 'CRECI_AnaHelena_Licenca.pdf',
    folderId: 'legal',
    addedAt: '2025-06-01',
    sizeLabel: 'PDF · 14.5 MB',
    detailsLabel: LEGAL_DOC_LABEL.license,
    status: 'completed',
    source: 'profile-legal',
    legalKind: 'license',
  },
  {
    id: 'doc-legal-employment',
    name: 'Contrato_Emprego_AnaHelena.pdf',
    folderId: 'legal',
    addedAt: '2025-06-01',
    sizeLabel: 'PDF · 8.2 MB',
    detailsLabel: LEGAL_DOC_LABEL.employment,
    status: 'completed',
    source: 'profile-legal',
    legalKind: 'employment',
  },
];

/** Espelha legal docs preenchidos do perfil na pasta `legal`. */
export function mirrorLegalDocumentsToFiles(
  legalDocuments: AgentProfile['legalDocuments'],
  existing: readonly DocumentFile[],
): DocumentFile[] {
  const today = new Date().toISOString().slice(0, 10);
  const withoutMirrored = existing.filter((doc) => doc.source !== 'profile-legal');
  const mirrors: DocumentFile[] = [];

  for (const legal of legalDocuments) {
    if (!legal.fileUrl?.trim() || !legal.name.trim()) continue;
    const previous = existing.find(
      (doc) => doc.source === 'profile-legal' && doc.legalKind === legal.kind,
    );
    mirrors.push({
      id: previous?.id ?? `doc-legal-${legal.kind}`,
      name: legal.name,
      folderId: 'legal',
      addedAt: previous?.addedAt ?? today,
      sizeLabel: legal.sizeLabel || '—',
      detailsLabel: LEGAL_DOC_LABEL[legal.kind],
      status: 'completed',
      source: 'profile-legal',
      legalKind: legal.kind,
    });
  }

  return [...withoutMirrored, ...mirrors];
}

export function createDefaultSettingsState(): SettingsState {
  const profile = {
    ...DEFAULT_PROFILE,
    legalDocuments: DEFAULT_PROFILE.legalDocuments.map((doc) => ({ ...doc })),
  };
  return {
    profile,
    documents: DOCUMENT_FILES.map((file) => ({ ...file })),
    privacy: {
      ...DEFAULT_PRIVACY,
      sessions: DEFAULT_PRIVACY.sessions.map((session) => ({ ...session })),
    },
    notifications: { ...DEFAULT_NOTIFICATIONS },
    users: DEFAULT_USERS.map((user) => ({
      ...user,
      permissions: { ...user.permissions },
    })),
    integrations: {
      whatsapp: { ...DEFAULT_INTEGRATIONS.whatsapp },
      olx: { ...DEFAULT_INTEGRATIONS.olx },
      zap: { ...DEFAULT_INTEGRATIONS.zap },
      'google-calendar': { ...DEFAULT_INTEGRATIONS['google-calendar'] },
      'meta-ads': { ...DEFAULT_INTEGRATIONS['meta-ads'] },
      asaas: { ...DEFAULT_INTEGRATIONS.asaas },
    },
    system: { ...DEFAULT_SYSTEM },
  };
}
