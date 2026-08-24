/**
 * Gate de acesso ao app da vertical Imóveis.
 *
 * **Com um realm por sistema (ADR C-16), estar no realm `citybox-imoveis` já é o
 * gate.** As roles `vertical.imoveis.view`, `store_staff` e `platform_admin` do
 * antigo realm compartilhado deixaram de existir — não há mais mapa de role →
 * permission ID.
 *
 * O que a pessoa pode fazer *dentro* do Imóveis continua vindo de
 * `@citybox/imoveis-permissions` + `TeamMember.permissions` da loja ativa
 * (`GET /v1/members/me`), nunca do token.
 */
import { IMOVEL_PERMISSION_IDS } from '@citybox/imoveis-permissions';

export const IMOVEL_VIEW_PERMISSION = 'vertical_access';

export const VERTICAL_VIEW_PERMISSIONS = [IMOVEL_VIEW_PERMISSION] as const;

/**
 * Expande as roles do JWT em permission IDs CASL do painel.
 *
 * Todo token válido deste realm ganha `vertical_access`. Além disso, passa
 * adiante `platform.admin` (realm role local atribuída só ao `admin-m2m`) e
 * qualquer ID que já seja do catálogo Imóveis.
 */
export function resolveBackofficePermissions(roles: string[]): string[] {
  const perms = new Set<string>([IMOVEL_VIEW_PERMISSION]);
  for (const role of roles) {
    if (role === 'platform.admin') perms.add(role);
    if ((IMOVEL_PERMISSION_IDS as readonly string[]).includes(role)) {
      perms.add(role);
    }
  }
  return [...perms];
}

/**
 * Sempre `true` para uma sessão autenticada: a fronteira de acesso é o realm.
 *
 * A assinatura foi preservada porque `store-routing.ts` e os gates de sessão a
 * chamam com a lista de permissões; o que mudou é que nenhuma role específica é
 * mais exigida.
 */
export function hasVerticalViewPermission(
  _permissions: string[],
  _verticalPermission: string = IMOVEL_VIEW_PERMISSION,
): boolean {
  return true;
}

export function hasBackofficeAccess(permissions: string[]): boolean {
  return hasVerticalViewPermission(permissions);
}
