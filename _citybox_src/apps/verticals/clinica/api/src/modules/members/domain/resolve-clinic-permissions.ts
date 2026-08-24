import { BadRequestException } from '@nestjs/common';
import {
  permissionsForRole,
  validatePermissionIds,
} from '@citybox/clinica-permissions';

/**
 * Resolve permissões a gravar no vínculo clínica↔membro.
 * - `permissions` omitido → defaults do cargo.
 * - array (inclusive vazio) → IDs válidos do catálogo CASL.
 * - IDs desconhecidos → 400 (não descartar em silêncio).
 */
export function resolveClinicPermissions(
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

/** Permissões efetivas do vínculo persistido (fonte de verdade em runtime). */
export function effectiveClinicPermissions(stored: string[]): string[] {
  // Leitura: ignora IDs legados/desconhecidos sem quebrar a listagem.
  return validatePermissionIds(stored).valid;
}
