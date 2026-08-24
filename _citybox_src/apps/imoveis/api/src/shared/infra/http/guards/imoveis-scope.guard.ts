import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TeamMemberRepository } from '../../../../modules/settings/domain/repositories/team-member.repository.interface';
import { effectiveImoveisPermissions } from '../../../../modules/settings/domain/resolve-imoveis-permissions';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SKIP_IMOVEIS_SCOPE_KEY } from '../decorators/skip-imoveis-scope.decorator';
import {
  isPlatformAdmin,
  type PermissionUser,
} from '../decorators/permissions';

export type ImoveisScope = {
  storeId: string;
  memberId: string;
  agentId: string;
  role: string;
  permissions: string[];
};

export const IMOVEIS_SCOPE_REQUEST_KEY = 'imoveisScope';

/**
 * Correlaciona JWT `sub` + `X-Store-Id` com `TeamMember` da loja.
 * Injeta permissões reais no request para o PermissionGuard CASL.
 */
@Injectable()
export class ImoveisScopeGuard implements CanActivate {
  private readonly logger = new Logger(ImoveisScopeGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly teamMembers: TeamMemberRepository,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    if (ctx.getType() !== 'http') return true;

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const skip = this.reflector.getAllAndOverride<boolean>(
      SKIP_IMOVEIS_SCOPE_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (skip) return true;

    const req = ctx.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      user?: PermissionUser & { sub?: string; email?: string };
      [IMOVEIS_SCOPE_REQUEST_KEY]?: ImoveisScope;
    }>();

    const storeId = headerValue(req.headers, 'x-store-id');
    if (!storeId) return true;

    const user = req.user;
    if (!user?.sub) throw new ForbiddenException('Sessão inválida');

    if (isPlatformAdmin(user)) {
      // Ainda tenta amarrar membership da loja — senão listagens ficam sem scope
      // e o risk é ver a carteira da loja inteira.
      if (user.sub) {
        let member = await this.teamMembers.findByStoreAndKeycloakSub(
          storeId,
          user.sub,
        );
        if (!member && user.email) {
          member = await this.teamMembers.findByEmail(storeId, user.email);
        }
        if (member && member.storeId === storeId && member.active) {
          const membershipPermissions = effectiveImoveisPermissions(
            member.permissions,
          );
          req[IMOVEIS_SCOPE_REQUEST_KEY] = {
            storeId,
            memberId: member.id,
            agentId: member.agentId,
            role: member.role,
            permissions: membershipPermissions,
          };
          req.user = {
            ...user,
            permissions: membershipPermissions,
            isOrganizationOwner: true,
          };
        }
      }
      return true;
    }

    let member = await this.teamMembers.findByStoreAndKeycloakSub(
      storeId,
      user.sub,
    );

    if (!member && user.email) {
      const byEmail = await this.teamMembers.findByEmail(storeId, user.email);
      if (byEmail && !byEmail.keycloakSub) {
        const username =
          user.email.split('@')[0]?.trim().toLowerCase() ?? user.sub;
        member = await this.teamMembers.linkKeycloakSub(byEmail.id, {
          keycloakSub: user.sub,
          username,
        });
      }
    }

    if (!member || member.storeId !== storeId) {
      this.logger.warn(
        `Acesso negado: sub ${user.sub} não é membro da loja ${storeId}`,
      );
      throw new ForbiddenException('Acesso negado a esta loja');
    }

    if (!member.active) {
      throw new ForbiddenException('Membro desativado');
    }

    if (!member.hasPassword) {
      await this.teamMembers.markPasswordSet(member.id);
    }

    const membershipPermissions = effectiveImoveisPermissions(
      member.permissions,
    );

    req[IMOVEIS_SCOPE_REQUEST_KEY] = {
      storeId,
      memberId: member.id,
      agentId: member.agentId,
      role: member.role,
      permissions: membershipPermissions,
    };

    req.user = {
      ...user,
      permissions: membershipPermissions,
      isOrganizationOwner: member.role === 'admin',
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
