/** Chaves persistidas no JSON de permissões da equipe (espelha UI/API). */
export const PERMISSION_KEYS = [
  'leads',
  'properties',
  'calendar',
  'transactions',
  'finance',
  'settings',
  'users',
  'billing',
  'integrations',
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export type PermissionBooleanMap = Record<PermissionKey, boolean>;

export function createEmptyBooleanMap(): PermissionBooleanMap {
  return Object.fromEntries(
    PERMISSION_KEYS.map((key) => [key, false]),
  ) as PermissionBooleanMap;
}

export function booleanMapFromPermissionIds(
  ids: readonly string[],
): PermissionBooleanMap {
  const set = new Set(ids);
  const base = createEmptyBooleanMap();
  return PERMISSION_KEYS.reduce<PermissionBooleanMap>((acc, key) => {
    acc[key] = set.has(key);
    return acc;
  }, { ...base });
}

export function permissionIdsFromBooleanMap(
  map: PermissionBooleanMap,
): string[] {
  return PERMISSION_KEYS.filter((key) => map[key]);
}
