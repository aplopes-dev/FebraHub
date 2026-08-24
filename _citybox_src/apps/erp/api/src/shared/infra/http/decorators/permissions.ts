import { SetMetadata } from '@nestjs/common';
import type { MembershipRoleValue } from '../../tenancy/tenant-context';

export const PERMISSION_KEY = 'citybox:permission';

export type PermissionUser = { roles: string[]; permissions?: string[] };

/**
 * Role local do realm `citybox-erp`, atribuída EXCLUSIVAMENTE ao service account
 * `admin-m2m` do admin-api (ADR C-16 §Papéis). Substituiu a realm role global
 * que cruzava sistemas.
 */
export const PLATFORM_ADMIN_ROLE = 'platform.admin';

// Vocabulário de operação por módulo — expanda conforme forem nascendo
// (catalogo, financas, vendas, estoque, ...).
const STORE_OPERATION_PERMISSIONS = [
  'store.catalog.manage',
  'store.settings.manage',
  'store.stock.manage',
  'store.sales.manage',
  'store.finance.manage',
  // Emitir documento fiscal (NFS-e — spec erp/018) é ação de alto impacto,
  // distinta do cadastro (`store.catalog.manage`). Concedida a OWNER/ADMIN/staff,
  // não a MEMBER.
  'store.fiscal.issue',
] as const;

/**
 * Permissões da arquitetura multi-empresa. Quem as concede é o `Membership` no
 * banco do ERP, não o token do Keycloak — ver `AGENTS.md` §5.10.
 */
const ORGANIZATION_PERMISSIONS = [
  'org.view',
  'org.manage',
  'org.branches.manage',
  'org.members.manage',
  'org.suppliers.manage',
  'org.customers.manage',
  'org.pos_terminals.manage',
  'org.pos_operators.manage',
  'org.pos_policies.manage',
] as const;

/**
 * Papel na organização → o que ele pode fazer.
 *
 * OWNER responde pela empresa (inclusive alterar o cadastro dela); ADMIN toca a
 * operação — unidades e equipe — mas não os dados da própria empresa; MEMBER
 * opera o dia a dia dentro das unidades a que tem acesso.
 */
const MEMBERSHIP_ROLE_PERMISSIONS: Record<MembershipRoleValue, string[]> = {
  OWNER: [...ORGANIZATION_PERMISSIONS, ...STORE_OPERATION_PERMISSIONS],
  ADMIN: [
    'org.view',
    'org.branches.manage',
    'org.members.manage',
    'org.suppliers.manage',
    'org.customers.manage',
    'org.pos_terminals.manage',
    'org.pos_operators.manage',
    'org.pos_policies.manage',
    ...STORE_OPERATION_PERMISSIONS,
  ],
  MEMBER: [
    'org.view',
    'store.catalog.manage',
    'store.stock.manage',
    'store.sales.manage',
  ],
};

export function resolveMembershipPermissions(
  role: MembershipRoleValue,
): string[] {
  return MEMBERSHIP_ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Roles do JWT → permissões.
 *
 * Com um realm por sistema (ADR C-16) o realm `citybox-erp` tem uma única role,
 * `platform.admin`, e a convenção passa a ser direta: **role com ponto é o
 * próprio nome da permissão**. Sumiram os mapas de papéis globais do Keycloak
 * que valiam para dois sistemas de uma vez.
 *
 * A autorização do lojista não vem daqui: vem do `Membership` e do
 * `PermissionProfile` no banco do ERP (`AGENTS.md` §5.10).
 */
export function resolvePermissions(user: PermissionUser): string[] {
  const perms = new Set<string>(user.permissions ?? []);
  for (const role of user.roles) {
    if (role.includes('.')) perms.add(role);
  }
  return [...perms];
}

export const RequirePermission = (permission: string) =>
  SetMetadata(PERMISSION_KEY, permission);
