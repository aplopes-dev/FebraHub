import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrganizationRepository } from '../../../../modules/tenancy/domain/repositories/tenancy.repositories';
import { MemberRepository } from '../../../../modules/tenancy/domain/repositories/member.repository';
import { effectiveStorePermissions } from '../../../../modules/tenancy/domain/resolve-store-permissions';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SKIP_STORE_SCOPE_KEY } from '../decorators/skip-store-scope.decorator';
import {
  hasPlatformAdmin,
  type PermissionUser,
} from '../decorators/permissions';

export type StoreScope = {
  organizationId: string;
  storeId: string;
  memberId: string;
  role: string;
  permissions: string[];
};

export const STORE_SCOPE_REQUEST_KEY = 'storeScope';

/**
 * Correlaciona `user.sub` ↔ `X-Store-Id` via `StoreMember`.
 * Bypass de `platform.admin` (M2M do admin). Rotas `@SkipStoreScope` / `@Public` não checam.
 */
@Injectable()
export class StoreScopeGuard implements CanActivate {
  private readonly logger = new Logger(StoreScopeGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly organizations: OrganizationRepository,
    private readonly members: MemberRepository,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    if (ctx.getType() !== 'http') return true;

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const skip = this.reflector.getAllAndOverride<boolean>(
      SKIP_STORE_SCOPE_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (skip) return true;

    const req = ctx.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      user?: PermissionUser;
      [STORE_SCOPE_REQUEST_KEY]?: StoreScope;
    }>();

    const rawStoreId = headerValue(req.headers, 'x-store-id');
    if (!rawStoreId) {
      // Sem loja: não inventa permissões de vínculo. Rotas @SkipStoreScope seguem;
      // rotas store-scoped falham no @StoreId() (400). Evita PermissionGuard
      // herdar estado residual e documenta o contrato explicitamente.
      if (req.user) {
        req.user = {
          ...req.user,
          permissions: [],
          isOrganizationOwner: false,
        };
      }
      return true;
    }

    const user = req.user;
    if (!user?.sub) throw new ForbiddenException('Sessão inválida');

    if (hasPlatformAdmin(user)) return true;

    const organization = await this.organizations.findByStoreId(rawStoreId);
    if (!organization) {
      throw new ForbiddenException('Acesso negado a esta loja');
    }

    if (organization.status === 'suspended') {
      throw new ForbiddenException(
        'Organização suspensa. Regularize o pagamento para continuar.',
      );
    }

    const member = await this.members.findByKeycloakSub(user.sub);
    if (!member || member.organizationId !== organization.id) {
      this.logger.warn(
        `Acesso negado: sub ${user.sub} não é membro da organização ${organization.id}`,
      );
      throw new ForbiddenException('Acesso negado a esta loja');
    }
    if (member.status !== 'active') {
      throw new ForbiddenException('Membro desativado');
    }

    if (!member.hasPassword) {
      await this.members.markPasswordSet(member.id);
    }

    const membership = member.memberships.find((m) => m.storeId === rawStoreId);
    if (!membership) {
      this.logger.warn(
        `Acesso negado: membro ${member.id} sem vínculo com a loja ${rawStoreId}`,
      );
      throw new ForbiddenException('Acesso negado a esta loja');
    }

    const permissions = effectiveStorePermissions(
      membership.role,
      membership.permissions,
    );

    req[STORE_SCOPE_REQUEST_KEY] = {
      organizationId: organization.id,
      storeId: rawStoreId,
      memberId: member.id,
      role: membership.role,
      permissions,
    };

    req.user = {
      ...user,
      permissions,
      isOrganizationOwner: member.organizationRole === 'OWNER',
    };

    return true;
  }
}

function headerValue(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string | null {
  const raw = headers[name] ?? headers[name.toUpperCase()];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value?.trim() ? value.trim() : null;
}
