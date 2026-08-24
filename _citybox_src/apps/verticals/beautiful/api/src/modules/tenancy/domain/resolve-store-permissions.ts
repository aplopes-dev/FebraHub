import { BadRequestException } from '@nestjs/common';
import {
  permissionsForRole,
  validatePermissionIds,
} from '@citybox/beautiful-permissions';

/**
 * Resolve permissões a gravar no vínculo loja↔membro.
 * - `permissions` omitido → defaults do papel.
 * - array (inclusive vazio) → IDs válidos do catálogo CASL.
 * - IDs desconhecidos → 400.
 */
export function resolveStorePermissions(
  role: string,
  permissions?: string[],
): string[] {
  if (permissions === undefined) {
    return permissionsForRole(role);
  }
  const { valid, invalid } = validatePermissionIds(permissions);
  if (invalid.length > 0) {
    throw new BadRequestException(
      `Permissões inválidas: ${invalid.join(', ')}`,
    );
  }
  return valid;
}

/**
 * Permissões efetivas em runtime.
 * Array vazio legado → preset do papel (bridge pós-Fase G).
 * IDs desconhecidos são descartados na leitura.
 */
export function effectiveStorePermissions(
  role: string,
  stored: string[],
): string[] {
  const valid = validatePermissionIds(stored).valid;
  if (valid.length === 0) {
    return permissionsForRole(role);
  }
  return valid;
}
