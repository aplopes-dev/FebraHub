import {
  CLINIC_PERMISSION_IDS,
  expandPermissionIds,
} from '@citybox/clinica-permissions';

const SETTINGS_BASE = '/configuracoes';
const SETTINGS_EQUIPE_HREF = `${SETTINGS_BASE}/equipe`;

/** Abas de Configurações → IDs de permissão que liberam a aba. */
export const SETTINGS_TAB_PERMISSIONS: ReadonlyArray<{
  href: string;
  permissionIds: readonly string[];
  /** Sem permissão específica — sempre visível (ex.: Equipe read-only). */
  always?: boolean;
}> = [
  {
    href: SETTINGS_BASE,
    permissionIds: [CLINIC_PERMISSION_IDS.settingsManage],
  },
  {
    href: SETTINGS_EQUIPE_HREF,
    permissionIds: [],
    always: true,
  },
  {
    href: `${SETTINGS_BASE}/planos`,
    permissionIds: [CLINIC_PERMISSION_IDS.settingsPlans],
  },
  {
    href: `${SETTINGS_BASE}/anamneses`,
    permissionIds: [CLINIC_PERMISSION_IDS.settingsAnamnesis],
  },
  {
    href: `${SETTINGS_BASE}/contrato`,
    permissionIds: [CLINIC_PERMISSION_IDS.settingsContracts],
  },
  {
    href: `${SETTINGS_BASE}/whatsapp`,
    permissionIds: [CLINIC_PERMISSION_IDS.settingsManage],
  },
  {
    href: `${SETTINGS_BASE}/categoria-paciente`,
    permissionIds: [
      CLINIC_PERMISSION_IDS.settingsCategoriesCreate,
      CLINIC_PERMISSION_IDS.settingsCategoriesUpdate,
    ],
  },
  {
    href: `${SETTINGS_BASE}/categoria-agendamento`,
    permissionIds: [
      CLINIC_PERMISSION_IDS.settingsCategoriesCreate,
      CLINIC_PERMISSION_IDS.settingsCategoriesUpdate,
    ],
  },
];

export function hasClinicPermissionId(
  permissions: readonly string[],
  permissionId: string,
): boolean {
  return expandPermissionIds(permissions).includes(permissionId);
}

export function hasAnyClinicPermissionId(
  permissions: readonly string[],
  permissionIds: readonly string[],
): boolean {
  const expanded = new Set(expandPermissionIds(permissions));
  return permissionIds.some((id) => expanded.has(id));
}

/** Rota exata da tela Clínica (dados cadastrais) — `/configuracoes`. */
export function isClinicProfileSettingsPath(pathname: string): boolean {
  const path = pathname.split('?')[0] ?? pathname;
  const normalized =
    path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
  return normalized === SETTINGS_BASE;
}

export function canAccessClinicProfileSettings(
  permissions: readonly string[],
): boolean {
  return hasClinicPermissionId(
    permissions,
    CLINIC_PERMISSION_IDS.settingsManage,
  );
}

/** Primeira aba liberada; Equipe é fallback permanente. */
export function firstAllowedSettingsPath(
  permissions: readonly string[],
): string {
  for (const tab of SETTINGS_TAB_PERMISSIONS) {
    if (tab.always) continue;
    if (hasAnyClinicPermissionId(permissions, tab.permissionIds)) {
      return tab.href;
    }
  }
  return SETTINGS_EQUIPE_HREF;
}

export function canAccessSettingsTab(
  permissions: readonly string[],
  href: string,
): boolean {
  const tab = SETTINGS_TAB_PERMISSIONS.find((item) => item.href === href);
  if (!tab) return true;
  if (tab.always) return true;
  return hasAnyClinicPermissionId(permissions, tab.permissionIds);
}
