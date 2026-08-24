import { ForbiddenException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type {
  MemberRecord,
  MemberRepository,
} from '../../../../modules/tenancy/domain/repositories/member.repository';
import type {
  OrganizationRecord,
  OrganizationRepository,
} from '../../../../modules/tenancy/domain/repositories/tenancy.repositories';
import { StoreScopeGuard, STORE_SCOPE_REQUEST_KEY } from './store-scope.guard';
import { PLATFORM_ADMIN_ROLE } from '../decorators/permissions';

const STORE_A = 'store-a';
const STORE_B = 'store-b';

function buildOrganization(
  id: string,
  status: 'active' | 'suspended' = 'active',
): OrganizationRecord {
  return { id, name: `Org ${id}`, status };
}

function buildMember(
  organizationId: string,
  storeId: string,
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
    phone: null,
    status,
    organizationRole: 'COLLABORATOR',
    hasPassword: true,
    provisionalExpiresAt: null,
    disabledAt: null,
    memberships: [
      {
        storeId,
        storeName: 'Loja',
        role: 'profissional',
        permissions: [],
      },
    ],
  };
}

type Harness = {
  guard: StoreScopeGuard;
  request: Record<string, unknown>;
  markPasswordSetCalls: string[];
};

function createHarness(options: {
  organization?: OrganizationRecord | null;
  member?: MemberRecord | null;
  headerStoreId?: string | null;
  sub?: string;
  roles?: string[];
}): Harness {
  const request: Record<string, unknown> = {
    headers: options.headerStoreId
      ? { 'x-store-id': options.headerStoreId }
      : {},
    user: {
      sub: options.sub ?? 'sub-1',
      roles: options.roles ?? [],
    },
  };

  const reflector = {
    getAllAndOverride: () => false,
  } as unknown as Reflector;

  const organizations = {
    findByStoreId: async () => options.organization ?? null,
  } as unknown as OrganizationRepository;

  const markPasswordSetCalls: string[] = [];
  const members = {
    findByKeycloakSub: async () => options.member ?? null,
    markPasswordSet: async (id: string) => {
      markPasswordSetCalls.push(id);
    },
  } as unknown as MemberRepository;

  return {
    guard: new StoreScopeGuard(reflector, organizations, members),
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

describe('StoreScopeGuard', () => {
  it('libera quando o membro tem vínculo com a loja do header', async () => {
    const org = buildOrganization('org-1');
    const { guard, request } = createHarness({
      organization: org,
      member: buildMember('org-1', STORE_A),
      headerStoreId: STORE_A,
    });

    await expect(guard.canActivate(ctxFor(request))).resolves.toBe(true);
    expect(request[STORE_SCOPE_REQUEST_KEY]).toEqual(
      expect.objectContaining({
        organizationId: 'org-1',
        storeId: STORE_A,
        memberId: 'member-1',
        role: 'profissional',
      }),
    );
  });

  it('nega quando não há StoreMember para o X-Store-Id', async () => {
    const org = buildOrganization('org-1');
    const { guard, request } = createHarness({
      organization: org,
      member: buildMember('org-1', STORE_A),
      headerStoreId: STORE_B,
    });

    await expect(guard.canActivate(ctxFor(request))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('libera platform.admin (M2M do admin) sem vínculo', async () => {
    const { guard, request } = createHarness({
      organization: null,
      member: null,
      headerStoreId: STORE_A,
      roles: [PLATFORM_ADMIN_ROLE],
    });

    await expect(guard.canActivate(ctxFor(request))).resolves.toBe(true);
  });

  it('não libera as roles globais antigas', async () => {
    for (const role of ['platform_admin', 'platform_admin_client']) {
      const { guard, request } = createHarness({
        organization: null,
        member: null,
        headerStoreId: STORE_A,
        roles: [role],
      });

      await expect(guard.canActivate(ctxFor(request))).rejects.toThrow(
        ForbiddenException,
      );
    }
  });

  it('libera rota sem X-Store-Id e zera permissions no user', async () => {
    const { guard, request } = createHarness({
      headerStoreId: null,
    });
    (request.user as { permissions?: string[] }).permissions = [
      'settings_manage',
    ];

    await expect(guard.canActivate(ctxFor(request))).resolves.toBe(true);
    expect(request.user).toEqual(
      expect.objectContaining({
        permissions: [],
        isOrganizationOwner: false,
      }),
    );
  });
});
