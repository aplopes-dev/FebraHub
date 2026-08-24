import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionGuard } from './permission.guard';
import {
  PERMISSION_KEY,
  PLATFORM_ADMIN_KEY,
  type PermissionMetadata,
} from '../decorators/permissions';

describe('PermissionGuard (CASL)', () => {
  function createGuard(meta: {
    permission?: PermissionMetadata;
    platformAdmin?: boolean;
  }) {
    const reflector = {
      getAllAndOverride: (key: string) => {
        if (key === PLATFORM_ADMIN_KEY) return meta.platformAdmin ?? false;
        if (key === PERMISSION_KEY) return meta.permission;
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

  it('owner passa em qualquer subject', () => {
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
          permissions: ['settings_team'],
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

  it('nega sem a permissão', () => {
    const guard = createGuard({
      permission: { action: 'create', subject: 'Team' },
    });
    expect(() =>
      guard.canActivate(
        ctx({
          sub: 'u1',
          roles: [],
          permissions: ['patients_manage'],
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('platform admin bypass', () => {
    const guard = createGuard({
      permission: { action: 'manage', subject: 'Financial' },
    });
    expect(
      guard.canActivate(
        ctx({ sub: 'admin', roles: ['platform.admin'], permissions: [] }),
      ),
    ).toBe(true);
  });

  it('RequirePlatformAdmin nega membro comum', () => {
    const guard = createGuard({ platformAdmin: true });
    expect(() =>
      guard.canActivate(
        ctx({ sub: 'u1', roles: [], permissions: ['settings_manage'] }),
      ),
    ).toThrow(ForbiddenException);
  });
});
