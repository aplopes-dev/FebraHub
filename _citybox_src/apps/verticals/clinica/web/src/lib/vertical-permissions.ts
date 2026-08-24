/**
 * Gate de acesso ao app da vertical Clínica.
 *
 * ## O que mudou com o realm por sistema (ADR C-16)
 *
 * Antes existia um mapa `BACKOFFICE_ROLE_PERMISSIONS` traduzindo realm roles do realm
 * compartilhado (`platform_admin`, `platform_admin_client`, `store_staff`,
 * `vertical.clinic.view`) para permission IDs CASL. Essas roles **não existem mais**:
 * o token deste app vem do realm `citybox-clinica`, emitido para o client `clinica-web`,
 * e o `AuthGuard` da API valida `issuer` + `azp`. **Estar no realm é o gate.**
 *
 * As permissões de verdade — as que decidem o que aparece na tela — vêm de
 * `@citybox/clinica-permissions` combinadas com o vínculo do membro no schema `clinica`,
 * resolvidas pela API (`ClinicScopeGuard` → `fetchMyStorePermissions`). Nunca do token.
 */
import { CLINIC_PERMISSION_IDS } from '@citybox/clinica-permissions';

export const CLINIC_VIEW_PERMISSION = CLINIC_PERMISSION_IDS.verticalAccess;

export const VERTICAL_VIEW_PERMISSIONS = [CLINIC_VIEW_PERMISSION] as const;

export const DEV_ADMIN_PERMISSIONS = [...VERTICAL_VIEW_PERMISSIONS] as const;

/**
 * Expande as roles do JWT em permission IDs CASL da sessão.
 *
 * Sessão do realm próprio: o acesso à vertical é implícito, então `vertical_access`
 * entra sempre. As demais roles seguem como estão — hoje a única com significado é
 * `platform.admin`, role local do realm atribuída ao service account `admin-m2m`.
 */
export function resolveBackofficePermissions(roles: string[]): string[] {
  return [...new Set([...roles, CLINIC_VIEW_PERMISSION])];
}

export function hasVerticalViewPermission(
  permissions: string[],
  verticalPermission: string = CLINIC_VIEW_PERMISSION,
): boolean {
  return (
    permissions.includes(verticalPermission) ||
    permissions.includes(CLINIC_VIEW_PERMISSION)
  );
}

/**
 * Gate do app: token válido do realm `citybox-clinica` dá acesso à vertical.
 * A autorização fina fica na API — este gate só evita montar o shell sem sessão.
 */
export function hasBackofficeAccess(permissions: string[]): boolean {
  return hasVerticalViewPermission(resolveBackofficePermissions(permissions));
}
