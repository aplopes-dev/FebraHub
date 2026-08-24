import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY, resolvePermissions, type PermissionUser } from '../common/permissions.js';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string | undefined>(PERMISSION_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required) return true;
    const user = ctx.switchToHttp().getRequest<{ user?: PermissionUser }>().user;
    if (!user) return false;
    const perms = resolvePermissions(user);
    return perms.includes('platform.admin') || perms.includes(required);
  }
}
