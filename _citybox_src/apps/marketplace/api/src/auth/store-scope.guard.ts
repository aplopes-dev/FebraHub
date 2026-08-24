import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { resolvePermissions } from '../common/permissions.js';
import type { AuthUser } from './auth.types.js';

@Injectable()
export class StoreScopeGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<{ user?: AuthUser; params: { storeId?: string } }>();
    const user = req.user;
    const storeId = req.params.storeId;
    if (!user || !storeId) return true;
    if (resolvePermissions(user).includes('platform.admin')) return true;
    if (user.kind === 'device' && user.storeId && user.storeId !== storeId) {
      throw new ForbiddenException('Device não autorizado para esta loja');
    }
    return true;
  }
}