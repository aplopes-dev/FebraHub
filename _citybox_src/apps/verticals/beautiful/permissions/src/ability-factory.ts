import { Ability, AbilityBuilder } from '@casl/ability';
import type { Actions } from './actions.js';
import { mapPermissionsToCasl } from './permission-mapper.js';
import type { AppAbility, Subjects } from './subjects.js';
import type { UserPermissions } from './types.js';

/**
 * Subjects cujo gate Nest ainda pode usar `manage` na 1ª leva.
 * Qualquer ability nesses subjects também concede `manage`.
 * Schedule / Client / Service / Product / Financial ficam fora (catálogo fino).
 */
const MANAGE_BRIDGE_SUBJECTS = new Set<Subjects>(['Settings', 'Stock']);

export function defineAbilityFor(user: UserPermissions): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(Ability);

  if (user.isOrganizationOwner) {
    can('manage', 'all');
    return build();
  }

  // Equipe (listagem): sempre visível — ações exigem checkboxes.
  can('read', 'Team');
  // Categorias (listagem / selects): leitura sempre; CRUD exige settings_categories_*.
  can('read', 'Category');

  const mappings = mapPermissionsToCasl(user.permissions);
  const bridged = new Set<Subjects>();
  let teamWrite = false;
  let serviceWrite = false;
  let productWrite = false;
  let clientWrite = false;
  let stockTouch = false;

  for (const { action, subject } of mappings) {
    can(action, subject);
    if (MANAGE_BRIDGE_SUBJECTS.has(subject)) {
      bridged.add(subject);
    }
    if (subject === 'Team' && action !== 'read') {
      teamWrite = true;
    }
    if (subject === 'Service' && action !== 'read') {
      serviceWrite = true;
    }
    if (subject === 'Product' && action !== 'read') {
      productWrite = true;
    }
    if (subject === 'Client' && action !== 'read') {
      clientWrite = true;
    }
    if (subject === 'Stock') {
      stockTouch = true;
    }
  }

  if (teamWrite) {
    can('read', 'Team');
  }
  if (serviceWrite) {
    can('read', 'Service');
  }
  if (productWrite) {
    can('read', 'Product');
  }
  if (clientWrite) {
    can('read', 'Client');
  }
  if (stockTouch) {
    can('access', 'Stock');
    can('read', 'Product');
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
