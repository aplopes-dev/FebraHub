import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionGuard } from './permission.guard';
import {
  PERMISSION_ANY_KEY,
  PERMISSION_KEY,
  PLATFORM_ADMIN_ROLE,
  type PermissionMetadata,
  type RequiredPermission,
} from '../decorators/permissions';

describe('PermissionGuard (CASL)', () => {
  function createGuard(meta: {
    permission?: RequiredPermission;
    permissionAny?: PermissionMetadata[];
  }) {
    const reflector = {
      getAllAndOverride: (key: string) => {
        if (key === PERMISSION_KEY) return meta.permission;
        if (key === PERMISSION_ANY_KEY) return meta.permissionAny;
        return undefined;
      },
    } as unknown as Reflector;
    return new PermissionGuard(reflector);
  }

  function ctx(user: Record<string, unknown> | undefined) {
    return {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('passa sem metadata', () => {
    const guard = createGuard({});
    expect(guard.canActivate(ctx({ roles: [] }))).toBe(true);
  });

  it('owner da org passa em qualquer subject', () => {
    const guard = createGuard({
      permission: { action: 'manage', subject: 'Team' },
    });
    expect(
      guard.canActivate(
        ctx({
          sub: 'u1',
          roles: [],
          permissions: [],
          isOrganizationOwner: true,
        }),
      ),
    ).toBe(true);
  });

  it('libera com permission id correspondente', () => {
    const guard = createGuard({
      permission: { action: 'create', subject: 'Team' },
    });
    expect(
      guard.canActivate(
        ctx({
          sub: 'u1',
          roles: [],
          permissions: ['settings_team_create'],
        }),
      ),
    ).toBe(true);
  });

  it('libera read Team sem checkbox (listagem sempre)', () => {
    const guard = createGuard({
      permission: { action: 'read', subject: 'Team' },
    });
    expect(
      guard.canActivate(
        ctx({
          sub: 'u1',
          roles: [],
          permissions: [],
        }),
      ),
    ).toBe(true);
  });

  it('nega collab sem a permissão', () => {
    const guard = createGuard({
      permission: { action: 'create', subject: 'Team' },
    });
    expect(() =>
      guard.canActivate(
        ctx({
          sub: 'u1',
          roles: [],
          permissions: ['client_read'],
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('platform.admin do realm faz bypass do CASL', () => {
    const guard = createGuard({
      permission: { action: 'manage', subject: 'Financial' },
    });
    expect(
      guard.canActivate(
        ctx({
          sub: 'admin-m2m',
          roles: [PLATFORM_ADMIN_ROLE],
          permissions: [],
        }),
      ),
    ).toBe(true);
  });

  it('roles globais antigas não são mais platform admin', () => {
    const guard = createGuard({
      permission: { action: 'manage', subject: 'Financial' },
    });
    for (const role of ['platform_admin', 'platform_admin_client']) {
      expect(() =>
        guard.canActivate(ctx({ sub: 'u1', roles: [role], permissions: [] })),
      ).toThrow(ForbiddenException);
    }
  });

  it("@RequirePermission('platform.admin') libera o M2M do admin", () => {
    const guard = createGuard({ permission: PLATFORM_ADMIN_ROLE });
    expect(
      guard.canActivate(
        ctx({ sub: 'admin-m2m', roles: [PLATFORM_ADMIN_ROLE] }),
      ),
    ).toBe(true);
  });

  it("@RequirePermission('platform.admin') nega membro comum", () => {
    const guard = createGuard({ permission: PLATFORM_ADMIN_ROLE });
    expect(() =>
      guard.canActivate(
        ctx({ sub: 'u1', roles: [], permissions: ['settings_manage'] }),
      ),
    ).toThrow(ForbiddenException);
  });
});
