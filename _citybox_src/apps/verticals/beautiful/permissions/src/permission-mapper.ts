import type { Actions } from './actions.js';
import { expandPermissionIds, PERMISSIONS_BY_ID } from './constants.js';
import type { Subjects } from './subjects.js';

export interface PermissionMapping {
  action: Actions;
  subject: Subjects;
}

export function mapPermissionToCasl(
  permissionId: string,
): PermissionMapping | null {
  const permission = PERMISSIONS_BY_ID.get(permissionId);
  if (!permission) return null;
  return { action: permission.action, subject: permission.subject };
}

/**
 * Expande aliases legados e mapeia para CASL.
 * Deduplica pares action+subject.
 */
export function mapPermissionsToCasl(
  permissionIds: string[],
): PermissionMapping[] {
  const expanded = expandPermissionIds(permissionIds);
  const seen = new Set<string>();
  const out: PermissionMapping[] = [];
  for (const id of expanded) {
    const mapping = mapPermissionToCasl(id);
    if (!mapping) continue;
    const key = `${mapping.action}:${mapping.subject}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(mapping);
  }
  return out;
}
