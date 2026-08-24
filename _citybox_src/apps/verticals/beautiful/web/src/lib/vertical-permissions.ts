/**
 * Gate de acesso ao app da vertical Beautiful.
 *
 * **Estar no realm `citybox-beautiful` é o gate** (ADR C-16). O realm é
 * exclusivo deste produto, então quem consegue um token dele é usuário do
 * Beautiful — não existe mais a client role `vertical.beautiful.view`, nem as
 * realm roles globais `platform_admin` / `store_staff` que cruzavam sistemas.
 *
 * O que sobra deste módulo é a tradução do JWT para o vocabulário CASL de
 * `@citybox/beautiful-permissions`: todo membro do realm ganha `vertical_access`
 * e as permissões finas continuam vindo do `StoreMember` (via `GET /v1/members/me`).
 *
 * A autorização de verdade — quais lojas, quais ações — é do `StoreScopeGuard`
 * e do `PermissionGuard` na API. Este arquivo só evita renderizar um shell
 * inteiro para quem nem token tem.
 */
import { BEAUTIFUL_PERMISSION_IDS } from '@citybox/beautiful-permissions';

export const BEAUTIFUL_VIEW_PERMISSION = BEAUTIFUL_PERMISSION_IDS.verticalAccess;

/**
 * Role local do realm, exclusiva do service account `admin-m2m` do admin-api.
 * No web ela só aparece em sessão de operação/diagnóstico.
 */
export const PLATFORM_ADMIN_ROLE = 'platform.admin';

export const VERTICAL_VIEW_PERMISSIONS = [BEAUTIFUL_VIEW_PERMISSION] as const;

export const DEV_ADMIN_PERMISSIONS = [...VERTICAL_VIEW_PERMISSIONS] as const;

/**
 * Expande as roles do JWT em permission IDs CASL do backoffice.
 *
 * Ser membro do realm já concede `vertical_access`; as roles do token seguem
 * adiante para quem precise delas (hoje, só `platform.admin`).
 */
export function resolveBackofficePermissions(roles: string[]): string[] {
  return [...new Set([BEAUTIFUL_VIEW_PERMISSION, ...roles])];
}

export function hasVerticalViewPermission(
  permissions: string[],
  verticalPermission: string = BEAUTIFUL_VIEW_PERMISSION,
): boolean {
  return (
    permissions.includes(verticalPermission) ||
    permissions.includes(BEAUTIFUL_VIEW_PERMISSION) ||
    permissions.includes(PLATFORM_ADMIN_ROLE)
  );
}

/**
 * Gate do `POST /api/auth/token`: o token precisa ser deste realm e
 * decodificável. `roles` vazio é sessão válida — não é motivo de 403.
 */
export function hasBackofficeAccess(roles: string[]): boolean {
  return hasVerticalViewPermission(resolveBackofficePermissions(roles));
}
