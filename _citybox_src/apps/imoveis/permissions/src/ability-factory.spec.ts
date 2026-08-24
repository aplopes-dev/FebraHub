import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { defineAbilityFor } from './ability-factory.js';
import { permissionsForRole } from './role-catalog.js';

describe('defineAbilityFor (imoveis)', () => {
  it('owner bypasses checks', () => {
    const ability = defineAbilityFor({
      userId: 'u1',
      permissions: [],
      isOrganizationOwner: true,
    });
    assert.equal(ability.can('manage', 'Lead'), true);
  });

  it('broker can manage leads but not settings or finance', () => {
    const ability = defineAbilityFor({
      userId: 'u2',
      permissions: permissionsForRole('broker'),
    });
    assert.equal(ability.can('manage', 'Lead'), true);
    assert.equal(ability.can('manage', 'Settings'), false);
    assert.equal(ability.can('manage', 'Finance'), false);
  });

  it('admin role includes finance', () => {
    const ability = defineAbilityFor({
      userId: 'u4',
      permissions: permissionsForRole('admin'),
    });
    assert.equal(ability.can('manage', 'Finance'), true);
  });

  it('affiliated broker matches broker ledger access', () => {
    const ability = defineAbilityFor({
      userId: 'u5',
      permissions: permissionsForRole('affiliated'),
    });
    assert.equal(ability.can('manage', 'Lead'), true);
    assert.equal(ability.can('manage', 'Transaction'), true);
    assert.equal(ability.can('manage', 'Settings'), false);
  });
});
