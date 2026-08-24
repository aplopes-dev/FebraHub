import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrganizationRepository } from '../../../../modules/tenancy/domain/repositories/tenancy.repositories';
import { MemberRepository } from '../../../../modules/members/domain/repositories/member.repository';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SKIP_CLINIC_SCOPE_KEY } from '../decorators/skip-clinic-scope.decorator';
import {
  isPlatformAdmin,
  type PermissionUser,
} from '../decorators/permissions';
import { effectiveClinicPermissions } from '../../../../modules/members/domain/resolve-clinic-permissions';

/** Escopo resolvido, anexado ao request para uso pelos decorators e use cases. */
export type ClinicScope = {
  organizationId: string;
  clinicId: string;
  memberId: string;
  role: string;
  /** Permissões efetivas do membro NESTA clínica (JSON do vínculo). */
  permissions: string[];
};

export const CLINIC_SCOPE_REQUEST_KEY = 'clinicScope';

/**
 * Fecha a falha de isolamento multi-tenant que existia até a Fase 6.
 *
 * ## O que estava errado
 *
 * Nada correlacionava o `sub` do JWT com o header `X-Store-Id`. Qualquer token do realm
 * chamando a API direto na :3172 lia e escrevia prontuário de **qualquer**
 * clínica. O `assertUserCanAccessStore` existia só no proxy do ERP/web — quem batesse na
 * API sem passar pelo proxy não era checado. Dado de saúde, exposição LGPD.
 *
 * ## O que este guard faz, sempre localmente
 *
 * 1. resolve `X-Store-Id`/`X-Clinic-Id` → `Clinic` → `Organization`;
 * 2. exige que o `keycloakSub` do token seja `Member` **daquela** organização e tenha
 *    vínculo (`ClinicMember`) com **aquela** clínica;
 * 3. nega quando a `Organization` está suspensa — enforcement de billing sem round-trip;
 * 4. injeta `role`/`permissions` reais do membro no request, para o `PermissionGuard`
 *    autorizar pelo papel de verdade e não só pelas roles genéricas do Keycloak;
 * 5. se o membro ainda está com `hasPassword: false`, chama `markPasswordSet` — JWT válido
 *    implica primeiro acesso concluído (espelha `GetMyAccessUseCase`).
 *
 * Quem tem `platform.admin` passa direto — operação da plataforma / M2M `admin-m2m`.
 * Desde o ADR C-16 essa é a **role local do realm `citybox-clinica`**, atribuída só ao
 * service account do `admin-api`; não há mais realm role global cruzando sistemas.
 */
@Injectable()
export class ClinicScopeGuard implements CanActivate {
  private readonly logger = new Logger(ClinicScopeGuard.name);

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
      SKIP_CLINIC_SCOPE_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (skip) return true;

    const req = ctx.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      user?: PermissionUser & { sub?: string };
      [CLINIC_SCOPE_REQUEST_KEY]?: ClinicScope;
    }>();

    const rawClinicId =
      headerValue(req.headers, 'x-clinic-id') ??
      headerValue(req.headers, 'x-store-id');

    // Rota sem escopo de clínica (ex.: /v1/members/me) resolve sozinha.
    if (!rawClinicId) return true;

    const user = req.user;
    if (!user?.sub) throw new ForbiddenException('Sessão inválida');

    // Operação da plataforma / M2M não é membro de clínica nenhuma.
    if (isPlatformAdmin(user)) return true;

    const organization = await this.organizations.findByClinicId(rawClinicId);
    if (!organization) {
      // Mensagem genérica de propósito: não confirmar existência de clínica alheia.
      throw new ForbiddenException('Acesso negado a esta clínica');
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
      throw new ForbiddenException('Acesso negado a esta clínica');
    }
    if (member.status !== 'active') {
      throw new ForbiddenException('Membro desativado');
    }

    // Mesma regra do GET /v1/members/me: JWT válido = primeiro acesso concluído.
    if (!member.hasPassword) {
      await this.members.markPasswordSet(member.id);
    }

    const membership = member.memberships.find(
      (m) => m.clinicId === rawClinicId,
    );
    if (!membership) {
      this.logger.warn(
        `Acesso negado: membro ${member.id} não tem vínculo com a clínica ${rawClinicId}`,
      );
      throw new ForbiddenException('Acesso negado a esta clínica');
    }

    // Fonte de verdade: JSON persistido no vínculo (editável na Equipe).
    const membershipPermissions = effectiveClinicPermissions(
      membership.permissions,
    );

    req[CLINIC_SCOPE_REQUEST_KEY] = {
      organizationId: organization.id,
      clinicId: rawClinicId,
      memberId: member.id,
      role: membership.role,
      permissions: membershipPermissions,
    };

    // Autorização usa IDs de `@citybox/clinica-permissions` + bypass de OWNER.
    req.user = {
      ...user,
      permissions: membershipPermissions,
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
