import {
  DEFAULT_CLINIC_STRAND,
  getClinicStrandDefinition,
  resolveClinicStrand,
  type ClinicStrand,
} from '@citybox/messaging/clinic-strand';
import {
  CLINIC_PERMISSION_IDS,
  PERMISSIONS_BY_ID,
  STORE_PERMISSION_IDS,
  STORE_PERMISSIONS_MODULES,
} from './constants.js';
import type { PermissionModule } from './types.js';

/**
 * Papéis clínicos da vertical — vocabulário de domínio compartilhado
 * (API lista em GET /v1/members/roles; Web usa para defaults de UI).
 */
export const CLINIC_ROLES = [
  { key: 'aluno', label: 'Aluno(a)' },
  { key: 'contador', label: 'Contador(a)' },
  { key: 'dentista_admin', label: 'Dentista administrador(a)' },
  { key: 'dentista', label: 'Dentista' },
  { key: 'gerente', label: 'Gerente' },
  { key: 'radiologia', label: 'Radiologia' },
  { key: 'secretario', label: 'Secretário(a)' },
  { key: 'vendedor', label: 'Vendedor(a)' },
] as const;

export type ClinicRoleKey = (typeof CLINIC_ROLES)[number]['key'];

export function isClinicRole(value: string): value is ClinicRoleKey {
  return CLINIC_ROLES.some((r) => r.key === value);
}

/** Cargos removidos do catálogo — só para label em membros já persistidos. */
export const LEGACY_CLINIC_ROLE_LABELS: Readonly<Record<string, string>> = {
  auxiliar: 'Auxiliar',
  recepcionista: 'Recepcionista',
  financeiro: 'Financeiro',
};

export function clinicRoleLabel(
  role: string,
  strand: ClinicStrand | string | null | undefined = DEFAULT_CLINIC_STRAND,
): string {
  const current = CLINIC_ROLES.find((r) => r.key === role);
  if (current) {
    if (role === 'dentista' || role === 'dentista_admin') {
      const resolved = resolveClinicStrand(strand ?? DEFAULT_CLINIC_STRAND);
      const labels = getClinicStrandDefinition(resolved).copy.roleLabels;
      return role === 'dentista_admin' ? labels.admin : labels.professional;
    }
    return current.label;
  }
  return LEGACY_CLINIC_ROLE_LABELS[role] ?? role;
}

/** Rótulo exibido na UI de permissões — alguns ids variam por vertente da clínica. */
export function clinicPermissionLabel(
  permissionId: string,
  strand: ClinicStrand | string | null | undefined = DEFAULT_CLINIC_STRAND,
): string {
  const permission = PERMISSIONS_BY_ID.get(permissionId);
  if (!permission) return permissionId;

  if (permissionId === CLINIC_PERMISSION_IDS.patientAnamnesis) {
    const resolved = resolveClinicStrand(strand ?? DEFAULT_CLINIC_STRAND);
    return getClinicStrandDefinition(resolved).copy.permissionLabels
      .patientAnamnesis;
  }

  return permission.label;
}

/** Módulos de permissão da loja com labels ajustados à vertente ativa. */
export function storePermissionsModulesForStrand(
  strand: ClinicStrand | string | null | undefined = DEFAULT_CLINIC_STRAND,
): PermissionModule[] {
  return STORE_PERMISSIONS_MODULES.map((module) => ({
    ...module,
    permissions: module.permissions.map((permission) => ({
      ...permission,
      label: clinicPermissionLabel(permission.id, strand),
    })),
  }));
}

const {
  scheduleViewMenu,
  scheduleAttend,
  scheduleDelete,
  stockAccess,
  patientCreate,
  patientDelete,
  patientReadPersonal,
  patientUpdatePersonal,
  patientBudgetCreate,
  patientBudgetRead,
  patientBudgetUpdate,
  patientBudgetDelete,
  patientEvolutionDelete,
  patientEvolutionUpdate,
  patientFileCreate,
  patientFileManage,
  patientFileDelete,
  patientDebit,
  patientPrescriptionCreate,
  patientCertificateCreate,
  patientAnamnesis,
  patientTreatments,
  financialSummary,
  financialIncomeView,
  financialIncomeCreate,
  financialIncomeUpdate,
  financialExpenseView,
  financialExpenseCreate,
  financialExpenseUpdate,
  financialExpenseDelete,
  financialPayReceive,
  financialReceiveFuture,
  financialCommissionOwn,
  financialCommissionAll,
  salesAccess,
  dashboardIndicators,
  dashboardTasks,
} = CLINIC_PERMISSION_IDS;

function moduleIds(moduleId: string): readonly string[] {
  const mod = STORE_PERMISSIONS_MODULES.find((m) => m.id === moduleId);
  return mod ? mod.permissions.map((p) => p.id) : [];
}

function moduleIdsExcept(
  moduleId: string,
  excluded: readonly string[],
): readonly string[] {
  const exclude = new Set(excluded);
  return moduleIds(moduleId).filter((id) => !exclude.has(id));
}

/**
 * IDs com feature real (API/UI). Mantido para compat / referência;
 * `dentista_admin` usa `STORE_PERMISSION_IDS` (todos os checkboxes).
 */
export const FEATURE_BACKED_PERMISSION_IDS: readonly string[] =
  STORE_PERMISSION_IDS.filter((id) => id !== 'vertical_access');

/** Permissões efetivas por papel — IDs finos do catálogo (sem `vertical_access`). */
const ROLE_PERMISSIONS: Record<ClinicRoleKey, readonly string[]> = {
  aluno: [scheduleViewMenu, scheduleAttend, patientAnamnesis],

  contador: [
    dashboardIndicators,
    stockAccess,
    financialCommissionOwn,
    financialExpenseView,
    financialIncomeView,
    financialSummary,
    financialCommissionAll,
  ],

  dentista_admin: [...STORE_PERMISSION_IDS],

  dentista: [
    scheduleDelete,
    scheduleAttend,
    scheduleViewMenu,
    ...moduleIdsExcept('patients', [patientEvolutionDelete, patientDelete]),
  ],

  gerente: [
    ...moduleIds('dashboard'),
    ...moduleIds('settings'),
    stockAccess,
    ...moduleIdsExcept('patients', [
      patientEvolutionUpdate,
      patientFileDelete,
      patientEvolutionDelete,
    ]),
    ...moduleIds('financial'),
    ...moduleIds('marketing'),
    ...moduleIds('sales'),
  ],

  radiologia: [patientFileCreate],

  secretario: [
    ...moduleIdsExcept('schedule', [scheduleAttend]),
    dashboardTasks,
    ...moduleIdsExcept('settings', [
      CLINIC_PERMISSION_IDS.settingsTeamCreate,
      CLINIC_PERMISSION_IDS.settingsTeamUpdate,
      CLINIC_PERMISSION_IDS.settingsTeamInactivate,
    ]),
    stockAccess,
    patientBudgetCreate,
    patientCreate,
    patientDebit,
    patientPrescriptionCreate,
    patientCertificateCreate,
    patientUpdatePersonal,
    patientBudgetUpdate,
    patientFileDelete,
    patientBudgetDelete,
    patientFileCreate,
    patientTreatments,
    patientReadPersonal,
    patientFileManage,
    patientBudgetRead,
    financialExpenseCreate,
    financialIncomeCreate,
    financialExpenseUpdate,
    financialIncomeUpdate,
    financialExpenseDelete,
    financialPayReceive,
    financialReceiveFuture,
    financialExpenseView,
    ...moduleIds('marketing'),
    ...moduleIdsExcept('sales', [salesAccess]),
  ],

  vendedor: [
    ...moduleIdsExcept('schedule', [scheduleAttend]),
    patientAnamnesis,
    patientBudgetCreate,
    patientCreate,
    patientDebit,
    patientUpdatePersonal,
    patientBudgetUpdate,
    patientBudgetDelete,
    patientTreatments,
    patientReadPersonal,
    patientBudgetRead,
    ...moduleIds('sales'),
  ],
};

export function permissionsForRole(role: string): string[] {
  return isClinicRole(role) ? [...ROLE_PERMISSIONS[role]] : [];
}
