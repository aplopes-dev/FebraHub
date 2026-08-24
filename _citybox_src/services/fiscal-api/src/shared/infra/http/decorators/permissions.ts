import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'citybox:permission';

export type PermissionUser = { roles: string[]; permissions?: string[] };

/// spec erp/023, N1: `fiscal.sequences.manage` faltava aqui — as 4 rotas de
/// escrita de `fiscal-sequences` exigiam essa string sem NINGUÉM tê-la
/// concedida, então só `platform_admin` (que passa por cima via
/// `platform.admin`) conseguia criar/ajustar/desativar/excluir série. Todo
/// lojista real recebia 403.
const FISCAL_PERMISSIONS = [
  'fiscal.companies.manage',
  'fiscal.certificates.manage',
  'fiscal.documents.manage',
  'fiscal.documents.view',
  'fiscal.sequences.manage',
] as const;

/**
 * As roles globais `platform_admin` / `platform_admin_client` saíram com o ADR
 * C-16: eram do realm compartilhado `citybox-dev`, que não existe mais. A role
 * pontuada `platform.admin` sobrevive, mas agora é **local ao realm de cada
 * sistema** e atribuída só a service account — nunca a usuário humano.
 */
const ROLE_PERMISSIONS: Record<string, string[]> = {
  'platform.admin': ['platform.admin', ...FISCAL_PERMISSIONS],
  /// Role atribuída, no realm do sistema consumidor, a quem pode operar o fiscal.
  fiscal_operator: [...FISCAL_PERMISSIONS],
};

export function resolvePermissions(user: PermissionUser): string[] {
  const perms = new Set<string>(user.permissions ?? []);
  for (const role of user.roles) {
    for (const p of ROLE_PERMISSIONS[role] ?? []) perms.add(p);
    if (role in ROLE_PERMISSIONS === false && role.includes('.'))
      perms.add(role);
  }
  return [...perms];
}

export const RequirePermission = (permission: string) =>
  SetMetadata(PERMISSION_KEY, permission);
