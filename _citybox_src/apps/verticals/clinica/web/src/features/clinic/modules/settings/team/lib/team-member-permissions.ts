import {
  expandPermissionIds,
  permissionsForRole,
  STORE_PERMISSION_IDS,
} from '@citybox/clinica-permissions';

export type TeamMemberPermissionSummary = {
  granted: number;
  total: number;
};

/** Mapa id → boolean a partir de um cargo (defaults). */
export function createPermissionMapForRole(
  apiRole: string,
): Record<string, boolean> {
  return createPermissionMapFromIds(permissionsForRole(apiRole));
}

/** Mapa id → boolean a partir de IDs CASL persistidos (expande aliases legados). */
export function createPermissionMapFromIds(
  ids: readonly string[],
): Record<string, boolean> {
  const granted = new Set(expandPermissionIds(ids));
  return STORE_PERMISSION_IDS.reduce<Record<string, boolean>>((acc, id) => {
    acc[id] = granted.has(id);
    return acc;
  }, {});
}

export function permissionIdsFromMap(
  values: Record<string, boolean>,
): string[] {
  return STORE_PERMISSION_IDS.filter((id) => values[id] === true);
}

export function getTeamMemberPermissionSummary(
  permissions: readonly string[],
): TeamMemberPermissionSummary {
  const expanded = new Set(expandPermissionIds(permissions));
  const granted = STORE_PERMISSION_IDS.filter((id) => expanded.has(id)).length;

  return {
    granted,
    total: STORE_PERMISSION_IDS.length,
  };
}
