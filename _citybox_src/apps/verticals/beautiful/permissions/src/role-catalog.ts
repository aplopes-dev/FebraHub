import {
  BEAUTIFUL_PERMISSION_IDS,
  STORE_PERMISSION_IDS,
  STORE_PERMISSIONS_MODULES,
} from './constants.js';

/**
 * Papéis operacionais da loja Beautiful — vocabulário de domínio compartilhado
 * (API lista em GET /v1/members/roles; Web usa para defaults de UI).
 * O responsável da organização NÃO é um cargo da loja: vive em `organizationRole`.
 */
export const STORE_ROLES = [
  { id: 'profissional', label: 'Profissional' },
  { id: 'recepcao', label: 'Recepção' },
  { id: 'gerente', label: 'Gerente' },
] as const;

export type StoreRoleId = (typeof STORE_ROLES)[number]['id'];

/** Papéis que aparecem na agenda (colunas = role profissional). */
export const SCHEDULABLE_STORE_ROLES = ['profissional'] as const;

export type SchedulableStoreRoleId = (typeof SCHEDULABLE_STORE_ROLES)[number];

/** Rótulos de cargos que ainda podem existir em vínculos antigos. */
const LEGACY_STORE_ROLE_LABELS: Record<string, string> = {
  owner: 'Responsável',
};

export function isStoreRole(value: string): value is StoreRoleId {
  return STORE_ROLES.some((r) => r.id === value);
}

export function isSchedulableStoreRole(role: string): boolean {
  return (SCHEDULABLE_STORE_ROLES as readonly string[]).includes(role);
}

export function storeRoleLabel(role: string): string {
  return (
    STORE_ROLES.find((r) => r.id === role)?.label ??
    LEGACY_STORE_ROLE_LABELS[role] ??
    role
  );
}

function moduleIds(moduleId: string): readonly string[] {
  const mod = STORE_PERMISSIONS_MODULES.find((m) => m.id === moduleId);
  return mod ? mod.permissions.map((p) => p.id) : [];
}

const {
  scheduleViewMenu,
  scheduleAttend,
  scheduleViewAll,
  scheduleCreateForOthers,
  scheduleDelete,
  clientCreate,
  clientRead,
  clientUpdate,
  clientDelete,
  serviceRead,
  productRead,
} = BEAUTIFUL_PERMISSION_IDS;

/** IDs com feature real (API/UI) — todos os checkboxes da Equipe. */
export const FEATURE_BACKED_PERMISSION_IDS: readonly string[] =
  STORE_PERMISSION_IDS;

const ROLE_PERMISSIONS: Record<StoreRoleId, readonly string[]> = {
  profissional: [
    scheduleViewMenu,
    scheduleAttend,
    scheduleDelete,
    clientCreate,
    clientRead,
    clientUpdate,
    clientDelete,
    serviceRead,
    productRead,
  ],

  recepcao: [
    scheduleViewMenu,
    scheduleViewAll,
    scheduleCreateForOthers,
    clientCreate,
    clientRead,
    clientUpdate,
    clientDelete,
    serviceRead,
  ],

  gerente: [...STORE_PERMISSION_IDS],
};

export function permissionsForRole(role: string): string[] {
  if (isStoreRole(role)) return [...ROLE_PERMISSIONS[role]];
  // Leitura de vínculos antigos com cargo `owner` (não há migration).
  if (role === 'owner') return [...STORE_PERMISSION_IDS];
  return [];
}

/** Helper de teste / docs — lista IDs de um módulo UI. */
export function permissionIdsForModule(moduleId: string): string[] {
  return [...moduleIds(moduleId)];
}
