import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import {
  booleanMapFromPermissionIds,
  permissionsForRole,
} from '@citybox/imoveis-permissions';
import { TeamMemberEntity } from '../../../../modules/settings/domain/entities/team-member.entity';
import type { TeamMemberRepository } from '../../../../modules/settings/domain/repositories/team-member.repository.interface';
import {
  ImoveisScopeGuard,
  IMOVEIS_SCOPE_REQUEST_KEY,
} from './imoveis-scope.guard';

const STORE_A = 'store-a';

function buildMember(
  storeId: string,
  overrides: Partial<{
    role: 'admin' | 'broker' | 'assistant';
    active: boolean;
    keycloakSub: string | null;
    email: string;
    hasPassword: boolean;
    permissions: ReturnType<typeof booleanMapFromPermissionIds>;
  }> = {},
): TeamMemberEntity {
  const role = overrides.role ?? 'broker';
  return TeamMemberEntity.create(
    {
      storeId,
      agentId: 'agent-1',
      name: 'Maria Silva',
      email: overrides.email ?? 'maria@test.com',
      phone: '',
      role,
      initials: 'MS',
      active: overrides.active ?? true,
      permissions:
        overrides.permissions ??
        booleanMapFromPermissionIds(permissionsForRole(role)),
      lastAccessAt: null,
      passwordHash: null,
      temporaryPassword: null,
      mustChangePassword: false,
      keycloakSub:
        'keycloakSub' in overrides ? (overrides.keycloakSub ?? null) : 'sub-1',
      username: 'maria',
      hasPassword: overrides.hasPassword ?? true,
    },
    'member-1',
  );
}

type Harness = {
  guard: ImoveisScopeGuard;
  request: Record<string, unknown>;
  markPasswordSetCalls: string[];
};

function createHarness(options: {
  member?: TeamMemberEntity | null;
  headerStoreId?: string | null;
  sub?: string;
  email?: string;
  roles?: string[];
  emailLookup?: TeamMemberEntity | null;
}): Harness {
  const request: Record<string, unknown> = {
    headers: options.headerStoreId
      ? { 'x-store-id': options.headerStoreId }
      : {},
    user: {
      sub: options.sub ?? 'sub-1',
      email: options.email ?? 'maria@test.com',
      roles: options.roles ?? [],
    },
  };

  const reflector = {
    getAllAndOverride: () => false,
  } as unknown as Reflector;

  const markPasswordSetCalls: string[] = [];
  const teamMembers = {
    findByStoreAndKeycloakSub: async (_storeId: string, sub: string) => {
      if (options.member && options.member.keycloakSub === sub) {
        return options.member;
      }
      return null;
    },
    findByEmail: async (_storeId: string, _email: string) =>
      options.emailLookup ?? null,
    linkKeycloakSub: async (
      _id: string,
      payload: { keycloakSub: string; username: string },
    ) => {
      const base =
        options.emailLookup ?? buildMember(STORE_A, { keycloakSub: null });
      return TeamMemberEntity.create(
        {
          ...base.props,
          keycloakSub: payload.keycloakSub,
          username: payload.username,
        },
        base.id,
      );
    },
    markPasswordSet: async (id: string) => {
      markPasswordSetCalls.push(id);
    },
  } as unknown as TeamMemberRepository;

  return {
    guard: new ImoveisScopeGuard(reflector, teamMembers),
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

describe('ImoveisScopeGuard', () => {
  it('libera quando o membro tem vínculo com a loja do header', async () => {
    const member = buildMember(STORE_A);
    const { guard, request } = createHarness({
      member,
      headerStoreId: STORE_A,
    });

    await expect(guard.canActivate(ctxFor(request))).resolves.toBe(true);

    const scope = request[IMOVEIS_SCOPE_REQUEST_KEY] as {
      storeId: string;
      role: string;
      permissions: string[];
    };
    expect(scope.storeId).toBe(STORE_A);
    expect(scope.role).toBe('broker');
    expect((request.user as { permissions: string[] }).permissions).toContain(
      'leads',
    );
    expect(
      (request.user as { isOrganizationOwner?: boolean }).isOrganizationOwner,
    ).toBe(false);
  });

  it('marca admin como organization owner', async () => {
    const member = buildMember(STORE_A, { role: 'admin' });
    const { guard, request } = createHarness({
      member,
      headerStoreId: STORE_A,
    });

    await guard.canActivate(ctxFor(request));
    expect(
      (request.user as { isOrganizationOwner?: boolean }).isOrganizationOwner,
    ).toBe(true);
  });

  it('nega acesso cross-store', async () => {
    const member = buildMember(STORE_A);
    const { guard, request } = createHarness({
      member,
      headerStoreId: 'store-b',
    });

    await expect(guard.canActivate(ctxFor(request))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('passa quando não há header de loja', async () => {
    const { guard, request } = createHarness({ headerStoreId: null });
    await expect(guard.canActivate(ctxFor(request))).resolves.toBe(true);
  });

  it('platform.admin bypassa escopo', async () => {
    const { guard, request } = createHarness({
      headerStoreId: STORE_A,
      roles: ['platform.admin'],
    });
    await expect(guard.canActivate(ctxFor(request))).resolves.toBe(true);
  });

  it('link-on-first-login por e-mail', async () => {
    const emailMember = buildMember(STORE_A, { keycloakSub: null });
    const { guard, request } = createHarness({
      member: null,
      emailLookup: emailMember,
      headerStoreId: STORE_A,
      sub: 'sub-new',
    });

    await expect(guard.canActivate(ctxFor(request))).resolves.toBe(true);
    expect(
      (request.user as { permissions: string[] }).permissions.length,
    ).toBeGreaterThan(0);
  });
});
