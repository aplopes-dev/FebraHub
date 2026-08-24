import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { PermissionGuard } from './permission.guard';
import type { PermissionUser } from '../decorators/permissions';
import {
  runWithTenantScope,
  setTenantContext,
  type MembershipRoleValue,
  type TenantContext,
} from '../../tenancy/tenant-context';

const ORGANIZATION_ID = 'org-1';

function makeContext(user: PermissionUser | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

function makeReflector(required: string | undefined): Reflector {
  return {
    getAllAndOverride: () => required,
  } as unknown as Reflector;
}

function makeTenant(
  role: MembershipRoleValue,
  permissionIds: string[],
): TenantContext {
  return {
    organizationId: ORGANIZATION_ID,
    membershipId: 'mem-1',
    role,
    branchIds: null,
    branchId: null,
    viaPlatformAdmin: false,
    permissionProfileId: permissionIds.length > 0 ? 'profile-1' : null,
    permissionIds,
  };
}

/** Roda o guard dentro de um escopo de tenant real (não mock do contexto). */
function can(
  required: string,
  role: MembershipRoleValue,
  permissionIds: string[],
  user: PermissionUser = { roles: [] },
): boolean {
  return runWithTenantScope(() => {
    setTenantContext(makeTenant(role, permissionIds));
    const guard = new PermissionGuard(makeReflector(required));
    return guard.canActivate(makeContext(user));
  });
}

describe('PermissionGuard', () => {
  describe('perfil restringe o papel (SEC-2)', () => {
    it('MEMBER com perfil sem escrita de estoque NÃO passa em store.stock.manage', () => {
      // O papel MEMBER concede store.stock.manage; o perfil não deve somar-se
      // a ele, e sim substituí-lo.
      expect(
        can('store.stock.manage', 'MEMBER', ['pdv.operacao.venda.create']),
      ).toBe(false);
    });

    it('MEMBER com perfil que concede a capability passa', () => {
      expect(
        can('store.stock.manage', 'MEMBER', ['estoque.inventarios.create']),
      ).toBe(true);
    });

    it('perfil só de leitura de estoque não abre escrita (SEC-1 + SEC-2 juntos)', () => {
      const perfilConferente = ['estoque.inventarios.view'];

      expect(can('store.stock.manage', 'MEMBER', perfilConferente)).toBe(false);
      expect(can('org.view', 'MEMBER', perfilConferente)).toBe(true);
    });
  });

  describe('fallback por papel quando não há perfil', () => {
    it('MEMBER sem perfil mantém as permissões do papel', () => {
      expect(can('store.stock.manage', 'MEMBER', [])).toBe(true);
    });

    it('MEMBER sem perfil não ganha o que o papel não dá', () => {
      expect(can('store.finance.manage', 'MEMBER', [])).toBe(false);
    });
  });

  describe('OWNER não pode se trancar para fora', () => {
    it('mantém as permissões do papel mesmo com perfil restritivo', () => {
      const perfilRestritivo = ['pdv.operacao.venda.create'];

      expect(can('org.manage', 'OWNER', perfilRestritivo)).toBe(true);
      expect(can('org.members.manage', 'OWNER', perfilRestritivo)).toBe(true);
      expect(can('store.stock.manage', 'OWNER', perfilRestritivo)).toBe(true);
    });

    it('ADMIN, ao contrário, é restringido pelo perfil', () => {
      expect(
        can('store.stock.manage', 'ADMIN', ['pdv.operacao.venda.create']),
      ).toBe(false);
    });
  });

  describe('regras gerais', () => {
    it('rota sem @RequirePermission libera', () => {
      const guard = new PermissionGuard(makeReflector(undefined));
      expect(guard.canActivate(makeContext({ roles: [] }))).toBe(true);
    });

    it('requisição sem usuário é negada', () => {
      const guard = new PermissionGuard(makeReflector('store.stock.manage'));
      expect(guard.canActivate(makeContext(undefined))).toBe(false);
    });

    it('platform.admin passa mesmo com perfil restritivo', () => {
      expect(
        can('store.finance.manage', 'MEMBER', ['pdv.operacao.venda.create'], {
          roles: ['platform.admin'],
        }),
      ).toBe(true);
    });
  });
});
