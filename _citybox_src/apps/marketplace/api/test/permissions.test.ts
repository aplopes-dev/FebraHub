import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolvePermissions } from '../src/auth/permissions.js';

describe('resolvePermissions', () => {
  it('consumer não ganha nenhuma permissão de backoffice', () => {
    const perms = resolvePermissions({ roles: ['consumer'], permissions: [] });
    assert.deepEqual(perms, []);
  });

  it('role pontuada do realm vira permissão (platform.admin)', () => {
    const perms = resolvePermissions({ roles: ['platform.admin'], permissions: [] });
    assert.ok(perms.includes('platform.admin'));
  });

  it('roles globais removidas pelo ADR C-16 não concedem nada', () => {
    const perms = resolvePermissions({
      roles: ['platform_admin', 'store_staff'],
      permissions: [],
    });
    assert.deepEqual(perms, []);
  });

  it('mescla permissions explícitas do token', () => {
    const perms = resolvePermissions({
      roles: ['consumer'],
      permissions: ['store.catalog.manage', 'custom.scope'],
    });
    assert.ok(perms.includes('store.catalog.manage'));
    assert.ok(perms.includes('custom.scope'));
  });
});
