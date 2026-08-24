import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  defineAbilityFor,
  type UserPermissions,
} from '@citybox/beautiful-permissions';
import {
  hasPlatformAdmin,
  PERMISSION_ANY_KEY,
  PERMISSION_KEY,
  type PermissionMetadata,
  type PermissionUser,
  type RequiredPermission,
} from '../decorators/permissions';

/**
 * Autorização.
 *
 * Duas fontes, nesta ordem:
 *
 * 1. **Plataforma** — a role `platform.admin` do realm `citybox-beautiful`,
 *    que só o service account `admin-m2m` do admin-api carrega (ADR C-16).
 *    É ela que libera as rotas `@RequirePermission('platform.admin')`.
 * 2. **Lojista** — `StoreMember.permissions`, resolvidas pelo `StoreScopeGuard`
 *    e avaliadas pelo CASL de `@citybox/beautiful-permissions`.
 *
 * O antigo `PlatformAdminGuard` + `isPlatformAdmin` (que aceitava quatro roles
 * diferentes, incluindo as globais `platform_admin` e `platform_admin_client`)
 * foi absorvido aqui.
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<
      RequiredPermission | undefined
    >(PERMISSION_KEY, [ctx.getHandler(), ctx.getClass()]);

    const requiredAny = this.reflector.getAllAndOverride<
      PermissionMetadata[] | undefined
    >(PERMISSION_ANY_KEY, [ctx.getHandler(), ctx.getClass()]);

    if (!required && !requiredAny?.length) return true;

    const user = ctx.switchToHttp().getRequest<{
      user?: PermissionUser;
    }>().user;
    if (!user) return false;

    if (hasPlatformAdmin(user)) return true;

    if (typeof required === 'string') {
      // Permissão de plataforma pedida por quem não é a plataforma.
      throw new ForbiddenException('Acesso restrito à operação da plataforma');
    }

    const input: UserPermissions = {
      userId: user.sub ?? 'unknown',
      permissions: user.permissions ?? [],
      isOrganizationOwner: user.isOrganizationOwner === true,
    };

    const ability = defineAbilityFor(input);

    if (requiredAny?.length) {
      const allowed = requiredAny.some((perm) =>
        ability.can(perm.action, perm.subject),
      );
      if (!allowed) {
        throw new ForbiddenException(
          'Você não tem permissão para esta operação',
        );
      }
      return true;
    }

    if (!required) return true;

    if (!ability.can(required.action, required.subject)) {
      throw new ForbiddenException(
        `Você não tem permissão para ${required.action} ${required.subject}`,
      );
    }
    return true;
  }
}
