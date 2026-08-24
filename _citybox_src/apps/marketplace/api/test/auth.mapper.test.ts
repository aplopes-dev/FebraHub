import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mapKeycloakPayload } from '../src/auth/auth.mapper.js';

const CLIENT_ID = 'marketplace-app';

describe('mapKeycloakPayload', () => {
  it('mescla roles de realm com as client roles do próprio client', () => {
    const user = mapKeycloakPayload(
      {
        sub: 'user-1',
        realm_access: { roles: ['consumer'] },
        resource_access: {
          'marketplace-app': { roles: ['beta-tester'] },
        },
        storeId: 's-1',
      },
      { clientId: CLIENT_ID },
    );
    assert.equal(user.sub, 'user-1');
    assert.equal(user.kind, 'user');
    assert.deepEqual(user.roles, ['consumer', 'beta-tester']);
    assert.equal(user.storeId, 's-1');
  });

  it('ignora client roles de outro client', () => {
    const user = mapKeycloakPayload(
      {
        sub: 'user-2',
        realm_access: { roles: ['consumer'] },
        resource_access: {
          'outro-client': { roles: ['nao-deveria-entrar'] },
        },
      },
      { clientId: CLIENT_ID },
    );
    assert.deepEqual(user.roles, ['consumer']);
  });

  it('deduplica roles repetidas entre realm e client', () => {
    const user = mapKeycloakPayload(
      {
        sub: 'user-3',
        realm_access: { roles: ['consumer'] },
        resource_access: { 'marketplace-app': { roles: ['consumer'] } },
      },
      { clientId: CLIENT_ID },
    );
    assert.deepEqual(user.roles, ['consumer']);
  });

  it('aceita snake_case store_id', () => {
    const user = mapKeycloakPayload({ sub: 42, store_id: 's-snake' }, { clientId: CLIENT_ID });
    assert.equal(user.sub, '42');
    assert.equal(user.storeId, 's-snake');
    assert.deepEqual(user.roles, []);
  });

  it('prefere camelCase sobre snake_case', () => {
    const user = mapKeycloakPayload(
      { sub: 'u', storeId: 's-camel', store_id: 's-snake' },
      { clientId: CLIENT_ID },
    );
    assert.equal(user.storeId, 's-camel');
  });
});
