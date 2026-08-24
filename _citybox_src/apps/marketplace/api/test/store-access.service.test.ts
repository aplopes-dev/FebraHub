import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { StoreAccessService } from '../src/users/store-access.service.js';

describe('StoreAccessService', () => {
  const storeId = 'store-1';
  const user = { sub: 'kc-sub-1', roles: ['consumer'] };

  it('permite platform.admin sem consultar membership', async () => {
    const platform = {
      $queryRaw: async () => {
        throw new Error('não deveria consultar');
      },
    };
    const svc = new StoreAccessService(platform as never);
    await svc.assertUserCanAccessStore(
      { ...user, roles: ['platform.admin'] },
      storeId,
    );
  });

  it('nega quando loja não existe', async () => {
    let call = 0;
    const platform = {
      $queryRaw: async () => {
        call += 1;
        return [];
      },
    };
    const svc = new StoreAccessService(platform as never);
    await assert.rejects(
      () => svc.assertUserCanAccessStore(user, storeId),
      NotFoundException,
    );
    assert.equal(call, 1);
  });

  it('nega quando usuário não tem vínculo com a loja', async () => {
    let call = 0;
    const platform = {
      $queryRaw: async () => {
        call += 1;
        return call === 1 ? [{ id: storeId }] : [];
      },
    };
    const svc = new StoreAccessService(platform as never);
    await assert.rejects(
      () => svc.assertUserCanAccessStore(user, storeId),
      ForbiddenException,
    );
    assert.equal(call, 2);
  });

  it('permite quando membership existe em platform.store_members', async () => {
    let call = 0;
    const platform = {
      $queryRaw: async () => {
        call += 1;
        return call === 1 ? [{ id: storeId }] : [{ id: 'member-1' }];
      },
    };
    const svc = new StoreAccessService(platform as never);
    await svc.assertUserCanAccessStore(user, storeId);
    assert.equal(call, 2);
  });
});
