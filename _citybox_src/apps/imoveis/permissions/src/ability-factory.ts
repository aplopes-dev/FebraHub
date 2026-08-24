import { Ability, AbilityBuilder } from '@casl/ability';
import { mapPermissionsToCasl } from './permission-mapper.js';
import type { Actions } from './actions.js';
import type { AppAbility, Subjects } from './subjects.js';
import type { UserPermissions } from './types.js';

/** Finance fica fora — enforcement fino por rota (padrão clinica-api). */
const MANAGE_BRIDGE_SUBJECTS = new Set<Subjects>([
  'Lead',
  'Property',
  'Calendar',
  'Transaction',
  'Settings',
  'Team',
  'Billing',
  'Integration',
]);

export function defineAbilityFor(user: UserPermissions): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(Ability);

  if (user.isOrganizationOwner) {
    can('manage', 'all');
    return build();
  }

  can('access', 'Vertical');
  can('read', 'Dashboard');

  const mappings = mapPermissionsToCasl(user.permissions);
  const bridged = new Set<Subjects>();

  for (const { action, subject } of mappings) {
    can(action, subject);
    if (MANAGE_BRIDGE_SUBJECTS.has(subject)) {
      bridged.add(subject);
    }
  }

  for (const subject of bridged) {
    can('manage', subject);
  }

  return build();
}

export function canUser(
  user: UserPermissions,
  action: Actions,
  subject: Subjects,
): boolean {
  return defineAbilityFor(user).can(action, subject);
}
