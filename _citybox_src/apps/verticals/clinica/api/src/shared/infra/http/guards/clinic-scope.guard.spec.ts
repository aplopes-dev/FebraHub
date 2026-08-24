import { ForbiddenException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { Organization } from '../../../../modules/tenancy/domain/entities/organization.entity';
import type { OrganizationRepository } from '../../../../modules/tenancy/domain/repositories/tenancy.repositories';
import type {
  MemberRecord,
  MemberRepository,
} from '../../../../modules/members/domain/repositories/member.repository';
import { ClinicScopeGuard, CLINIC_SCOPE_REQUEST_KEY } from './clinic-scope.guard';

const CLINIC_A = 'clinic-a';
const CLINIC_B = 'clinic-b';

function buildOrganization(
  id: string,
  status: 'active' | 'suspended' = 'active',
): Organization {
  return Organization.create(
    {
      storeId: `store-${id}`,
      name: `Org ${id}`,
      status,
      plan: { planId: null, tier: null, maxClinics: null, maxUsers: null },
      overQuota: false,
      suspendedReason: null,
      platformUpdatedAt: null,
      syncedAt: new Date(),
    },
    id,
  );
}

function buildMember(
  organizationId: string,
  clinicId: string,
  status: 'active' | 'disabled' = 'active',
): MemberRecord {
  return {
    id: 'member-1',
    organizationId,
    keycloakSub: 'sub-1',
    username: 'maria',
    email: null,
    firstName: 'Maria',
    lastName: 'Silva',
    status,
    organizationRole: 'COLLABORATOR',
    hasPassword: true,
    provisionalExpiresAt: null,
    disabledAt: null,
    councilType: null,
    councilNumber: null,
    councilUf: null,
    memberships: [
      {
        clinicId,
        clinicName: 'Clínica',
        role: 'dentista',
        permissions: ['patients_manage', 'schedule_manage'],
      },
    ],
  };
}

type Harness = {
  guard: ClinicScopeGuard;
  request: Record<string, unknown>;
  markPasswordSetCalls: string[];
};

function createHarness(options: {
  organization?: Organization | null;
  member?: MemberRecord | null;
  headerClinicId?: string | null;
  sub?: string;
  roles?: string[];
}): Harness {
  const request: Record<string, unknown> = {
    headers: options.headerClinicId
      ? { 'x-store-id': options.headerClinicId }
      : {},
    user: { sub: options.sub ?? 'sub-1', roles: options.roles ?? [] },
  };

  const reflector = {
    getAllAndOverride: () => false,
  } as unknown as Reflector;

  const organizations = {
    findByClinicId: async () => options.organization ?? null,
  } as unknown as OrganizationRepository;

  const markPasswordSetCalls: string[] = [];
  const members = {
    findByKeycloakSub: async () => options.member ?? null,
    markPasswordSet: async (id: string) => {
      markPasswordSetCalls.push(id);
    },
  } as unknown as MemberRepository;

  return {
    guard: new ClinicScopeGuard(reflector, organizations, members),
    request,
    markPasswordSetCalls,
  };
}

function ctxFor(request: Record<string, unknown>) {
  return {
    getType: () => 'http',
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => request }),
  } as never;
}

describe('ClinicScopeGuard', () => {
  it('libera quando o membro tem vínculo com a clínica do header', async () => {
    const org = buildOrganization('org-1');
    const { guard, request } = createHarness({
      organization: org,
      member: buildMember('org-1', CLINIC_A),
      headerClinicId: CLINIC_A,
    });

    await expect(guard.canActivate(ctxFor(request))).resolves.toBe(true);

    const scope = request[CLINIC_SCOPE_REQUEST_KEY] as {
      clinicId: string;
      role: string;
      permissions: string[];
    };
    expect(scope.clinicId).toBe(CLINIC_A);
    expect(scope.role).toBe('dentista');
    // Permissões do vínculo persistido entram no request para o PermissionGuard.
    expect(
      (request.user as { permissions: string[] }).permissions,
    ).toEqual(['patients_manage', 'schedule_manage']);
    expect(
      (request.user as { isOrganizationOwner?: boolean }).isOrganizationOwner,
    ).toBe(false);
  });

  it('usa permissões persistidas mesmo quando diferem do default do cargo', async () => {
    const org = buildOrganization('org-1');
    const base = buildMember('org-1', CLINIC_A);
    const member: MemberRecord = {
      ...base,
      memberships: [
        {
          clinicId: CLINIC_A,
          clinicName: 'Clínica',
          role: 'dentista',
          permissions: ['patients_manage'],
        },
      ],
    };
    const { guard, request } = createHarness({
      organization: org,
      member,
      headerClinicId: CLINIC_A,
    });

    await expect(guard.canActivate(ctxFor(request))).resolves.toBe(true);
    expect(
      (request.user as { permissions: string[] }).permissions,
    ).toEqual(['patients_manage']);
  });

  it('NEGA acesso a clínica de outra organização (falha corrigida na Fase 6)', async () => {
    // Cenário exato do buraco anterior: token válido, X-Store-Id de outra clínica.
    // Antes da Fase 6 isto devolvia 200 e lia prontuário alheio.
    const otherOrg = buildOrganization('org-outra');
    const { guard, request } = createHarness({
      organization: otherOrg,
      member: buildMember('org-1', CLINIC_A),
      headerClinicId: CLINIC_B,
    });

    await expect(guard.canActivate(ctxFor(request))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('nega quando o membro é da mesma organização mas não daquela clínica', async () => {
    const org = buildOrganization('org-1');
    const { guard, request } = createHarness({
      organization: org,
      member: buildMember('org-1', CLINIC_A),
      headerClinicId: CLINIC_B,
    });

    await expect(guard.canActivate(ctxFor(request))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('nega quando a organização está suspensa (enforcement local de billing)', async () => {
    const org = buildOrganization('org-1', 'suspended');
    const { guard, request } = createHarness({
      organization: org,
      member: buildMember('org-1', CLINIC_A),
      headerClinicId: CLINIC_A,
    });

    await expect(guard.canActivate(ctxFor(request))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('nega membro desativado', async () => {
    const org = buildOrganization('org-1');
    const { guard, request } = createHarness({
      organization: org,
      member: buildMember('org-1', CLINIC_A, 'disabled'),
      headerClinicId: CLINIC_A,
    });

    await expect(guard.canActivate(ctxFor(request))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('nega quando o sub do token não é membro de lugar nenhum', async () => {
    const { guard, request } = createHarness({
      organization: buildOrganization('org-1'),
      member: null,
      headerClinicId: CLINIC_A,
    });

    await expect(guard.canActivate(ctxFor(request))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  // Regressão do ADR C-16: `platform_admin` era realm role GLOBAL cruzando sistemas.
  // Depois do realm por sistema só vale `platform.admin`, local deste realm.
  it('não libera a realm role global legada platform_admin', async () => {
    const { guard, request } = createHarness({
      organization: buildOrganization('org-1'),
      member: null,
      headerClinicId: CLINIC_A,
      roles: ['platform_admin'],
    });

    await expect(guard.canActivate(ctxFor(request))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('libera platform.admin — role local do realm atribuída ao admin-m2m', async () => {
    const { guard, request } = createHarness({
      organization: buildOrganization('org-1'),
      member: null,
      headerClinicId: CLINIC_A,
      roles: ['platform.admin'],
    });

    await expect(guard.canActivate(ctxFor(request))).resolves.toBe(true);
  });

  it('libera rota sem header de clínica (ex.: /v1/members/me)', async () => {
    const { guard, request } = createHarness({ headerClinicId: null });
    await expect(guard.canActivate(ctxFor(request))).resolves.toBe(true);
  });

  it('marca hasPassword no primeiro request autenticado com senha provisória', async () => {
    const pending = {
      ...buildMember('org-1', CLINIC_A),
      hasPassword: false,
      provisionalExpiresAt: new Date(Date.now() + 86_400_000),
    };

    const { guard, request, markPasswordSetCalls } = createHarness({
      organization: buildOrganization('org-1'),
      member: pending,
      headerClinicId: CLINIC_A,
    });

    await expect(guard.canActivate(ctxFor(request))).resolves.toBe(true);
    expect(markPasswordSetCalls).toEqual(['member-1']);
  });
});
