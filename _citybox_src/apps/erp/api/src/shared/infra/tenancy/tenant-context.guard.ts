import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../http/decorators/public.decorator';
import { SKIP_TENANT_KEY } from '../http/decorators/skip-tenant.decorator';
import { PLATFORM_ADMIN_ROLE } from '../http/decorators/permissions';
import type { AuthenticatedUser } from '../http/auth/authenticated-user';
import { ALL_PERMISSION_ITEM_IDS } from '../http/permissions/permission-catalog';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationAccessForbiddenError } from './errors/organization-access-forbidden.error';
import { OrganizationInactiveForbiddenError } from './errors/organization-inactive-forbidden.error';
import { BranchAccessForbiddenError } from './errors/branch-access-forbidden.error';
import {
  runWithoutTenantScope,
  setRequestActor,
  setTenantContext,
  type RequestActor,
  type TenantContext,
} from './tenant-context';

type TenantRequest = {
  headers: Record<string, string | string[] | undefined>;
  user?: AuthenticatedUser;
};

function readHeader(req: TenantRequest, name: string): string | undefined {
  const raw = req.headers[name];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value?.trim() || undefined;
}

/**
 * Camada de interceptação da arquitetura multi-empresa: traduz "quem é o
 * usuário" (Keycloak) em "o que ele pode operar aqui" (banco do ERP), e publica
 * isso no contexto da requisição.
 *
 * Roda depois do `AuthGuard` e antes do `PermissionGuard` — a ordem vem da
 * ordem de declaração dos `APP_GUARD` em `app.module.ts`.
 */
@Injectable()
export class TenantContextGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<TenantRequest>();
    const user = req.user;
    if (!user) return true;

    // Todo o trabalho do guard acontece FORA do escopo de tenant: ele é quem
    // vai estabelecer o escopo, então não pode ser filtrado por ele.
    const actor = await runWithoutTenantScope(() => this.resolveActor(user));
    setRequestActor(actor);

    const skipTenant = this.reflector.getAllAndOverride<boolean>(
      SKIP_TENANT_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (skipTenant) return true;

    const organizationId = readHeader(req, 'x-organization-id');
    if (!organizationId) {
      throw new BadRequestException('Header X-Organization-Id obrigatório');
    }

    const branchId = readHeader(req, 'x-branch-id') ?? null;
    const context = await runWithoutTenantScope(() =>
      this.resolveTenant(actor, organizationId, branchId),
    );
    // Fora do `runWithoutTenantScope`: o holder de dentro é descartado ao fim
    // do `run`, e o contexto precisa sobreviver até o handler.
    setTenantContext(context);

    return true;
  }

  /**
   * Espelha o usuário do Keycloak na tabela local, criando no primeiro acesso.
   * `upsert` e não "busca e cria": duas requisições simultâneas do mesmo
   * usuário novo violariam o unique de `keycloak_sub`.
   */
  private async resolveActor(user: AuthenticatedUser): Promise<RequestActor> {
    const email = user.email?.trim().toLowerCase() || null;
    const name = user.username?.trim() || null;
    const now = new Date();

    const row = await this.prisma.user.upsert({
      where: { keycloakSub: user.sub },
      create: { keycloakSub: user.sub, email, name, updatedAt: now },
      // Mantém e-mail/nome em dia com o Keycloak, mas nunca apaga o que já
      // existe localmente quando o token vem sem o claim.
      update: {
        ...(email ? { email } : {}),
        ...(name ? { name } : {}),
        updatedAt: now,
      },
    });

    return {
      userId: row.id,
      keycloakSub: row.keycloakSub,
      email: row.email,
      name: row.name,
      isPlatformAdmin: user.roles.includes(PLATFORM_ADMIN_ROLE),
    };
  }

  private async resolveTenant(
    actor: RequestActor,
    organizationId: string,
    branchId: string | null,
  ): Promise<TenantContext> {
    const membership = await this.prisma.membership.findFirst({
      where: { organizationId, userId: actor.userId, active: true },
      include: {
        organization: { select: { status: true, deletedAt: true } },
        permissionProfile: {
          select: { permissionIds: true, deletedAt: true },
        },
      },
    });

    if (!membership) {
      return this.resolvePlatformAdminTenant(actor, organizationId, branchId);
    }

    this.assertOrganizationUsable(
      organizationId,
      membership.organization.status,
      membership.organization.deletedAt,
    );

    const role = membership.role;
    const branchIds =
      role === 'MEMBER' ? await this.loadBranchIds(membership.id) : null;

    // Sem perfil (legado / OWNER pré-backfill): lista vazia — o PermissionGuard
    // continua liberando via `resolveMembershipPermissions(role)`.
    const permissionIds =
      membership.permissionProfile &&
      membership.permissionProfile.deletedAt === null
        ? [...membership.permissionProfile.permissionIds]
        : [];

    return {
      organizationId,
      membershipId: membership.id,
      role,
      branchIds,
      branchId: await this.resolveBranch(
        organizationId,
        branchId,
        branchIds,
        membership.id,
      ),
      viaPlatformAdmin: false,
      permissionProfileId: membership.permissionProfileId,
      permissionIds,
    };
  }

  /**
   * Operador da plataforma entra sem `Membership` — é o que permite suporte e
   * o teste pelo Swagger com o bypass de dev. Fica registrado no contexto
   * (`viaPlatformAdmin`) para não se confundir com acesso de membro real.
   */
  private async resolvePlatformAdminTenant(
    actor: RequestActor,
    organizationId: string,
    branchId: string | null,
  ): Promise<TenantContext> {
    if (!actor.isPlatformAdmin) {
      throw new OrganizationAccessForbiddenError(organizationId, actor.userId);
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { status: true, deletedAt: true },
    });
    if (!organization) {
      throw new OrganizationAccessForbiddenError(organizationId, actor.userId);
    }
    this.assertOrganizationUsable(
      organizationId,
      organization.status,
      organization.deletedAt,
    );

    return {
      organizationId,
      membershipId: null,
      role: 'OWNER',
      branchIds: null,
      branchId: await this.resolveBranch(organizationId, branchId, null, null),
      viaPlatformAdmin: true,
      permissionProfileId: null,
      permissionIds: [...ALL_PERMISSION_ITEM_IDS],
    };
  }

  private assertOrganizationUsable(
    organizationId: string,
    status: string,
    deletedAt: Date | null,
  ): void {
    if (deletedAt) {
      throw new OrganizationInactiveForbiddenError(organizationId, 'DELETED');
    }
    if (status !== 'ACTIVE') {
      throw new OrganizationInactiveForbiddenError(organizationId, status);
    }
  }

  private async loadBranchIds(membershipId: string): Promise<string[]> {
    const rows = await this.prisma.branchAccess.findMany({
      where: { membershipId },
      select: { branchId: true },
    });
    return rows.map((row) => row.branchId);
  }

  /** Valida `X-Branch-Id` contra a organização ativa e o acesso do membro. */
  private async resolveBranch(
    organizationId: string,
    branchId: string | null,
    branchIds: string[] | null,
    membershipId: string | null,
  ): Promise<string | null> {
    if (!branchId) return null;

    if (branchIds !== null && !branchIds.includes(branchId)) {
      throw new BranchAccessForbiddenError(branchId, membershipId ?? 'unknown');
    }

    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!branch) {
      throw new BranchAccessForbiddenError(branchId, membershipId ?? 'unknown');
    }
    return branch.id;
  }
}
