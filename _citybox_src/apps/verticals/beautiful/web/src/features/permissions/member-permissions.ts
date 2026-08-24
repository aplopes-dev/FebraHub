import {
  expandPermissionIds,
  permissionsForRole,
  STORE_PERMISSION_IDS,
} from '@citybox/beautiful-permissions';

/** Mapa id → boolean a partir de um papel (defaults). */
export function createPermissionMapForRole(
  apiRole: string,
): Record<string, boolean> {
  return createPermissionMapFromIds(permissionsForRole(apiRole));
}

/** Mapa id → boolean a partir de IDs CASL persistidos. */
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

export type MemberPermissionSummary = {
  granted: number;
  total: number;
};

export function getMemberPermissionSummary(
  permissions: readonly string[],
): MemberPermissionSummary {
  const expanded = new Set(expandPermissionIds(permissions));
  const granted = STORE_PERMISSION_IDS.filter((id) => expanded.has(id)).length;

  return {
    granted,
    total: STORE_PERMISSION_IDS.length,
  };
}
