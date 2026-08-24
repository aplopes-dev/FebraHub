import { BadRequestException } from '@nestjs/common';
import {
  booleanMapFromPermissionIds,
  permissionIdsFromBooleanMap,
  permissionsForRole,
  validatePermissionIds,
  type PermissionBooleanMap,
} from '@citybox/imoveis-permissions';
import {
  isTeamMemberRole,
  type TeamMemberRole,
} from './entities/team-member.entity';

/**
 * Resolve permissões a gravar no membro da equipe.
 * - `permissions` omitido → defaults do cargo.
 * - boolean map → IDs válidos do catálogo CASL.
 */
export function resolveImoveisPermissions(
  role: string,
  permissions?: Partial<PermissionBooleanMap>,
): PermissionBooleanMap {
  const roleKey = isTeamMemberRole(role) ? role : 'broker';
  const defaults = booleanMapFromPermissionIds(permissionsForRole(roleKey));
  if (permissions === undefined) {
    return defaults;
  }
  const merged = { ...defaults, ...permissions };
  const ids = permissionIdsFromBooleanMap(merged);
  const { invalid } = validatePermissionIds(ids);
  if (invalid.length > 0) {
    throw new BadRequestException(
      `Permissões inválidas: ${invalid.join(', ')}`,
    );
  }
  return merged;
}

/** Permissões efetivas do membro persistido (fonte de verdade em runtime). */
export function effectiveImoveisPermissions(
  stored: PermissionBooleanMap,
): string[] {
  const ids = permissionIdsFromBooleanMap(stored);
  return validatePermissionIds(ids).valid;
}

export function permissionsBooleanMapForRole(
  role: TeamMemberRole,
): PermissionBooleanMap {
  return booleanMapFromPermissionIds(permissionsForRole(role));
}
