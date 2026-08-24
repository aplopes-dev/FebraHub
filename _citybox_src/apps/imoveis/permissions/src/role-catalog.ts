import {
  booleanMapFromPermissionIds,
  type PermissionBooleanMap,
} from './boolean-map.js';
import { STORE_PERMISSION_IDS } from './constants.js';

export const IMOVEL_ROLES = [
  { key: 'admin', label: 'Administrador' },
  { key: 'broker', label: 'Administrador/Corretor' },
  { key: 'affiliated', label: 'Corretor filiado' },
  { key: 'assistant', label: 'Assistente' },
] as const;

export type ImovelRoleKey = (typeof IMOVEL_ROLES)[number]['key'];

export function isImovelRole(value: string): value is ImovelRoleKey {
  return IMOVEL_ROLES.some((r) => r.key === value);
}

export function imovelRoleLabel(role: string): string {
  return IMOVEL_ROLES.find((r) => r.key === role)?.label ?? role;
}

/** Defaults por cargo — espelham `permissionsForRole` legado da API/Web. */
export function permissionsForRole(role: ImovelRoleKey): string[] {
  if (role === 'admin') {
    return [...STORE_PERMISSION_IDS];
  }
  if (role === 'broker' || role === 'affiliated') {
    return ['leads', 'properties', 'calendar', 'transactions'];
  }
  return ['leads', 'properties', 'calendar'];
}

/** Mapa booleano para persistência/UI (compatível com `TeamMember.permissions`). */
export function booleanPermissionsForRole(
  role: ImovelRoleKey,
): PermissionBooleanMap {
  return booleanMapFromPermissionIds(permissionsForRole(role));
}

export const FEATURE_BACKED_PERMISSION_IDS = [...STORE_PERMISSION_IDS];

export { IMOVEL_PERMISSION_IDS } from './constants.js';
