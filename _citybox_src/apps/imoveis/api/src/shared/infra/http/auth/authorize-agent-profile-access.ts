import { ForbiddenException } from '@nestjs/common';
import { defineAbilityFor } from '@citybox/imoveis-permissions';
import {
  isPlatformAdmin,
  type PermissionUser,
} from '../decorators/permissions';
import type { ImoveisScope } from '../guards/imoveis-scope.guard';

/**
 * Perfil do corretor: o membro acessa **o próprio** agentId sem checkbox Settings;
 * para outro corretor da loja exige read/manage Settings.
 */
export function authorizeAgentProfileAccess(options: {
  user?: PermissionUser;
  scope?: ImoveisScope;
  targetAgentId: string;
  mode: 'read' | 'write';
}): void {
  const { user, scope, targetAgentId, mode } = options;
  if (!user) {
    throw new ForbiddenException('Sessão inválida');
  }
  if (isPlatformAdmin(user)) return;

  const self = scope?.agentId && scope.agentId === targetAgentId;
  if (self) return;

  const ability = defineAbilityFor({
    userId: user.sub ?? 'unknown',
    permissions: user.permissions ?? [],
    isOrganizationOwner: user.isOrganizationOwner === true,
  });

  const allowed =
    mode === 'read'
      ? ability.can('read', 'Settings') || ability.can('manage', 'Settings')
      : ability.can('manage', 'Settings');

  if (!allowed) {
    throw new ForbiddenException(
      mode === 'read'
        ? 'Você não tem permissão para ver este perfil'
        : 'Você não tem permissão para editar este perfil',
    );
  }
}
