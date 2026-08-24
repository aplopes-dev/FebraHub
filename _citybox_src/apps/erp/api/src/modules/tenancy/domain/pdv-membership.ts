import { PDV_ALCADA_AUTHORIZE_PERMISSION } from '../../../shared/infra/http/permissions/permission-catalog';
import type { MembershipDetail } from './repositories/membership.repository.interface';

/** Prefixo das permissões que habilitam operação de caixa no PDV. */
export const PDV_OPERACAO_PERMISSION_PREFIX = 'pdv.operacao.';

export function membershipPermissionIds(detail: MembershipDetail): string[] {
  return detail.permissionProfile?.permissionIds ?? [];
}

export function hasPdvOperacaoPermission(permissionIds: string[]): boolean {
  return permissionIds.some((id) =>
    id.startsWith(PDV_OPERACAO_PERMISSION_PREFIX),
  );
}

export function canAuthorizePdvAlcada(permissionIds: string[]): boolean {
  return permissionIds.includes(PDV_ALCADA_AUTHORIZE_PERMISSION);
}

/**
 * Membro elegível para login no PDV nesta unidade:
 * ativo + código/PIN + alguma `pdv.operacao.*` + acesso à branch do terminal.
 */
export function isPdvLoginEligible(
  detail: MembershipDetail,
  branchId: string,
): boolean {
  const { membership } = detail;
  if (!membership.active || !membership.hasPdvPin) return false;
  if (!hasPdvOperacaoPermission(membershipPermissionIds(detail))) return false;
  if (membership.hasImplicitAccessToAllBranches) return true;
  return detail.branchIds.includes(branchId);
}

/**
 * Vendedor elegível no PDV nesta unidade: ativo + isSeller + acesso à branch.
 * Não exige PIN — atribuição de venda ≠ operação de caixa.
 */
export function isPdvSellerEligible(
  detail: MembershipDetail,
  branchId: string,
): boolean {
  const { membership } = detail;
  if (!membership.active || !membership.isSeller) return false;
  if (membership.hasImplicitAccessToAllBranches) return true;
  return detail.branchIds.includes(branchId);
}
