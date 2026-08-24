import { ForbiddenException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { permissionsForRole } from '@citybox/imoveis-permissions';
import { PermissionGuard } from './permission.guard';

function ctx(user?: {
  sub?: string;
  permissions?: string[];
  isOrganizationOwner?: boolean;
  roles?: string[];
}) {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({
      getRequest: () => ({
        user: user
          ? {
              sub: user.sub ?? 'sub-1',
              roles: user.roles ?? [],
              permissions: user.permissions,
              isOrganizationOwner: user.isOrganizationOwner,
            }
          : undefined,
      }),
    }),
  } as never;
}

describe('PermissionGuard (CASL imoveis)', () => {
  const reflector = {
    getAllAndOverride: (key: string) => {
      if (key === 'citybox:casl-permission') {
        return { action: 'manage', subject: 'Finance' };
      }
      return undefined;
    },
  } as unknown as Reflector;

  const guard = new PermissionGuard(reflector);

  it('broker sem finance recebe 403', () => {
    expect(() =>
      guard.canActivate(ctx({ permissions: permissionsForRole('broker') })),
    ).toThrow(ForbiddenException);
  });

  it('admin com finance passa', () => {
    expect(
      guard.canActivate(ctx({ permissions: permissionsForRole('admin') })),
    ).toBe(true);
  });

  it('organization owner bypassa', () => {
    expect(
      guard.canActivate(ctx({ permissions: [], isOrganizationOwner: true })),
    ).toBe(true);
  });
});
