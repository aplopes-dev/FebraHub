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
} from '@citybox/clinica-permissions';
import {
  isPlatformAdmin,
  PERMISSION_ANY_KEY,
  PERMISSION_KEY,
  PLATFORM_ADMIN_KEY,
  type PermissionMetadata,
  type PermissionUser,
} from '../decorators/permissions';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const platformAdminOnly = this.reflector.getAllAndOverride<boolean>(
      PLATFORM_ADMIN_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );

    const required = this.reflector.getAllAndOverride<
      PermissionMetadata | undefined
    >(PERMISSION_KEY, [ctx.getHandler(), ctx.getClass()]);

    const requiredAny = this.reflector.getAllAndOverride<
      PermissionMetadata[] | undefined
    >(PERMISSION_ANY_KEY, [ctx.getHandler(), ctx.getClass()]);

    if (!platformAdminOnly && !required && !requiredAny?.length) return true;

    const user = ctx
      .switchToHttp()
      .getRequest<{ user?: PermissionUser }>().user;
    if (!user) return false;

    if (isPlatformAdmin(user)) return true;

    if (platformAdminOnly) {
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
          'Você não tem permissão para esta operação financeira',
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
