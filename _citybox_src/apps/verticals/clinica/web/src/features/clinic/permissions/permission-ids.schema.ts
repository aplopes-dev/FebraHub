import { z } from 'zod';
import { isValidPermissionId } from '@citybox/clinica-permissions';

/**
 * Schema de formulário: forma (`string[]`) + significado (IDs do catálogo).
 * Melhoria em relação ao Odontotech (guia §7.4).
 */
export const permissionIdsSchema = z
  .array(z.string())
  .refine((ids) => ids.every(isValidPermissionId), {
    message: 'Uma ou mais permissões são inválidas',
  });
