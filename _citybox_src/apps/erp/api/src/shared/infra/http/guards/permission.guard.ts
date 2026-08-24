import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSION_KEY,
  resolveMembershipPermissions,
  resolvePermissions,
  type PermissionUser,
} from '../decorators/permissions';
import { resolveCoarseFromFine } from '../permissions/fine-to-coarse';
import { getTenantContextOrNull } from '../../tenancy/tenant-context';

/**
 * Autorização.
 *
 * A fonte principal é o papel do usuário na organização ativa (`Membership`, no
 * banco do ERP): é ele que sabe que a mesma pessoa pode ser responsável numa
 * empresa e apenas operadora em outra. As roles do JWT seguem valendo para o
 * que é da plataforma (`platform.admin`, role local do realm `citybox-erp`
 * atribuída ao service account `admin-m2m`).
 *
 * Quando o membro tem `PermissionProfile`, o perfil é a **autoridade**: as
 * capabilities vêm de `resolveCoarseFromFine` e o papel não é somado. Unir os
 * dois (comportamento anterior) tornava o perfil puramente aditivo — como
 * MEMBER já concede `store.stock.manage` por papel, atribuir um perfil
 * restritivo não restringia nada, e a tela de Perfis de Acesso era decorativa
 * para toda capability `store.*`.
 *
 * `permissionIds` vazio significa "membro sem perfil" (legado) e cai no
 * fallback por papel — contrato já declarado em `TenantContext`.
 *
 * OWNER é a exceção deliberada: responde pela empresa e mantém as permissões
 * do papel mesmo com perfil atribuído. Sem isso, atribuir um perfil restritivo
 * ao dono produz um estado sem saída — ninguém mais tem `org.members.manage`
 * para desfazer a atribuição.
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string | undefined>(
      PERMISSION_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (!required) return true;
    const user = ctx
      .switchToHttp()
      .getRequest<{ user?: PermissionUser }>().user;
    if (!user) return false;

    const permissions = new Set(resolvePermissions(user));
    const tenant = getTenantContextOrNull();
    if (tenant) {
      const hasProfile = tenant.permissionIds.length > 0;
      const profileIsAuthoritative = hasProfile && tenant.role !== 'OWNER';

      if (!profileIsAuthoritative) {
        for (const permission of resolveMembershipPermissions(tenant.role)) {
          permissions.add(permission);
        }
      }
      for (const permission of resolveCoarseFromFine(tenant.permissionIds)) {
        permissions.add(permission);
      }
    }

    return permissions.has('platform.admin') || permissions.has(required);
  }
}
