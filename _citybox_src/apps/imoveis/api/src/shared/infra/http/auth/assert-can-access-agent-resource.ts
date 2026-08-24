import { ForbiddenException } from '@nestjs/common';
import type { PermissionUser } from '../decorators/permissions';
import type { ImoveisScope } from '../guards/imoveis-scope.guard';
import { canAccessAgentResource } from './resolve-scoped-agent-id';

/**
 * Garante que corretor não leia/escreva lead/imóvel de outro perfil.
 * Admin/dono (store-wide) passa.
 */
export function assertCanAccessAgentResource(options: {
  user?: PermissionUser;
  scope?: ImoveisScope;
  resourceAgentId?: string | null;
  resourceAgentIds?: readonly string[] | null;
  context?: string;
}): void {
  if (
    canAccessAgentResource({
      user: options.user,
      scope: options.scope,
      resourceAgentId: options.resourceAgentId,
      resourceAgentIds: options.resourceAgentIds,
    })
  ) {
    return;
  }
  throw new ForbiddenException(
    options.context
      ? `Você não tem acesso a este registro (${options.context}).`
      : 'Você não tem acesso a este registro.',
  );
}
