import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ForbiddenException } from '@nestjs/common';
import { StoreScopeGuard } from '../src/auth/store-scope.guard.js';

function ctx(user: unknown, storeId?: string) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user, params: { storeId } }),
    }),
  } as never;
}

describe('StoreScopeGuard', () => {
  const guard = new StoreScopeGuard();

  it('platform.admin passa em qualquer loja', () => {
    assert.equal(guard.canActivate(ctx({ roles: ['platform.admin'] }, 'other-store')), true);
  });

  it('device em loja errada lança Forbidden', () => {
    assert.throws(
      () => guard.canActivate(ctx({ roles: ['device'], kind: 'device', storeId: 's-1' }, 's-2')),
      ForbiddenException,
    );
  });

  it('device na loja correta passa', () => {
    assert.equal(guard.canActivate(ctx({ roles: ['device'], kind: 'device', storeId: 's-1' }, 's-1')), true);
  });

  it('sem user ou storeId passa sem checagem', () => {
    assert.equal(guard.canActivate(ctx(undefined, 's-1')), true);
    assert.equal(guard.canActivate(ctx({ roles: ['device'], kind: 'device', storeId: 's-1' })), true);
  });

  it('device sem storeId vinculado passa', () => {
    assert.equal(guard.canActivate(ctx({ roles: ['device'], kind: 'device' }, 's-9')), true);
  });
});
