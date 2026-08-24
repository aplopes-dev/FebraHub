import { ForbiddenException } from '@nestjs/common';
import {
  defineAbilityFor,
  type AppAbility,
} from '@citybox/clinica-permissions';
import type { PermissionUser } from '../decorators/permissions';
import type { ClinicScope } from '../guards/clinic-scope.guard';

export function buildCommissionAbility(
  scope: ClinicScope,
  user: PermissionUser,
): AppAbility {
  return defineAbilityFor({
    userId: scope.memberId,
    permissions: scope.permissions,
    isOrganizationOwner: user.isOrganizationOwner === true,
  });
}

/**
 * `update` (todas) → respeita filtro opcional.
 * Só `read` (própria) → força o memberId do usuário logado.
 */
export function resolveCommissionMemberFilter(
  ability: AppAbility,
  selfMemberId: string,
  requestedMemberId?: string,
): string | undefined {
  if (ability.can('update', 'FinancialCommission')) {
    return requestedMemberId;
  }
  if (
    requestedMemberId &&
    requestedMemberId !== selfMemberId
  ) {
    throw new ForbiddenException(
      'Você só pode visualizar a própria comissão',
    );
  }
  return selfMemberId;
}

export function assertCanReadCommissionMember(
  ability: AppAbility,
  selfMemberId: string,
  targetMemberId: string,
): void {
  if (ability.can('update', 'FinancialCommission')) return;
  if (targetMemberId === selfMemberId) return;
  throw new ForbiddenException(
    'Você só pode visualizar a própria comissão',
  );
}
