import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  canUser,
  defineAbilityFor,
  expandPermissionIds,
  isValidPermissionId,
  permissionsForRole,
  STORE_PERMISSION_IDS,
  STORE_ROLES,
  validatePermissionIds,
} from './index.js';

describe('defineAbilityFor', () => {
  it('owner bypasses with manage all', () => {
    const ability = defineAbilityFor({
      userId: 'u1',
      permissions: [],
      isOrganizationOwner: true,
    });
    assert.equal(ability.can('manage', 'Team'), true);
    assert.equal(ability.can('manage', 'Client'), true);
    assert.equal(ability.can('access', 'Schedule'), true);
  });

  it('grants only mapped permissions', () => {
    const ability = defineAbilityFor({
      userId: 'u2',
      permissions: ['settings_team_create', 'schedule_view_menu'],
    });
    assert.equal(ability.can('create', 'Team'), true);
    assert.equal(ability.can('read', 'Team'), true);
    assert.equal(ability.can('update', 'Team'), false);
    assert.equal(ability.can('access', 'Schedule'), true);
    assert.equal(ability.can('create', 'Client'), false);
  });

  it('always grants Team read and Category read without checkboxes', () => {
    const ability = defineAbilityFor({
      userId: 'u-empty',
      permissions: [],
    });
    assert.equal(ability.can('read', 'Team'), true);
    assert.equal(ability.can('create', 'Team'), false);
    assert.equal(ability.can('read', 'Category'), true);
    assert.equal(ability.can('create', 'Category'), false);
  });

  it('settings_manage does not grant Category create/update', () => {
    const ability = defineAbilityFor({
      userId: 'u-settings',
      permissions: ['settings_manage'],
    });
    assert.equal(ability.can('manage', 'Settings'), true);
    assert.equal(ability.can('create', 'Category'), false);
    assert.equal(ability.can('update', 'Category'), false);
  });

  it('client write also grants client read', () => {
    const ability = defineAbilityFor({
      userId: 'u-client',
      permissions: ['client_create'],
    });
    assert.equal(ability.can('create', 'Client'), true);
    assert.equal(ability.can('read', 'Client'), true);
  });
});

describe('permissionsForRole', () => {
  it('gerente gets all store permission ids', () => {
    assert.deepEqual(
      permissionsForRole('gerente').sort(),
      [...STORE_PERMISSION_IDS].sort(),
    );
  });

  it('legacy owner role still resolves to all permissions on read', () => {
    assert.deepEqual(
      permissionsForRole('owner').sort(),
      [...STORE_PERMISSION_IDS].sort(),
    );
  });

  it('profissional includes attend and clients, not team create', () => {
    const ids = permissionsForRole('profissional');
    assert.ok(ids.includes('schedule_attend'));
    assert.ok(ids.includes('client_read'));
    assert.equal(ids.includes('settings_team_create'), false);
    assert.equal(ids.includes('settings_manage'), false);
  });

  it('recepcao includes view_all and create_for_others, not attend', () => {
    const ids = permissionsForRole('recepcao');
    assert.ok(ids.includes('schedule_view_all'));
    assert.ok(ids.includes('schedule_create_for_others'));
    assert.equal(ids.includes('schedule_attend'), false);
    assert.equal(ids.includes('stock_access'), false);
  });

  it('unknown role returns empty', () => {
    assert.deepEqual(permissionsForRole('desconhecido'), []);
  });

  it('STORE_ROLES has three operational roles without owner', () => {
    assert.deepEqual(
      STORE_ROLES.map((r) => r.id),
      ['profissional', 'recepcao', 'gerente'],
    );
  });
});

describe('validatePermissionIds / expand', () => {
  it('rejects unknown ids', () => {
    const { valid, invalid } = validatePermissionIds([
      'schedule_view_menu',
      'nope',
    ]);
    assert.deepEqual(valid, ['schedule_view_menu']);
    assert.deepEqual(invalid, ['nope']);
  });

  it('expands settings_team alias', () => {
    const expanded = expandPermissionIds(['settings_team']);
    assert.ok(expanded.includes('settings_team_create'));
    assert.ok(expanded.includes('settings_team_update'));
    assert.ok(expanded.includes('settings_team_inactivate'));
  });

  it('isValidPermissionId accepts fine and legacy', () => {
    assert.equal(isValidPermissionId('client_read'), true);
    assert.equal(isValidPermissionId('settings_team'), true);
    assert.equal(isValidPermissionId('xxx'), false);
  });
});

describe('canUser', () => {
  it('delegates to defineAbilityFor', () => {
    assert.equal(
      canUser(
        { userId: 'u', permissions: ['financial_access'] },
        'access',
        'Financial',
      ),
      true,
    );
  });
});
