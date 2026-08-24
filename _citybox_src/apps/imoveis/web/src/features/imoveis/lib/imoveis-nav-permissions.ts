import {
  defineAbilityFor,
  type Actions,
  type AppAbility,
  type Subjects,
} from '@citybox/imoveis-permissions';
import type { PermissionKey } from '@citybox/imoveis-permissions';

function normalizePathname(pathname: string): string {
  const path = pathname.split('?')[0] ?? pathname;
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
}

const PERMISSION_KEY_TO_CASL: Record<
  PermissionKey,
  { action: Actions; subject: Subjects }
> = {
  leads: { action: 'read', subject: 'Lead' },
  properties: { action: 'read', subject: 'Property' },
  calendar: { action: 'read', subject: 'Calendar' },
  transactions: { action: 'read', subject: 'Transaction' },
  finance: { action: 'read', subject: 'Finance' },
  settings: { action: 'read', subject: 'Settings' },
  users: { action: 'read', subject: 'Team' },
  billing: { action: 'read', subject: 'Billing' },
  integrations: { action: 'read', subject: 'Integration' },
};

export function canPermissionKey(
  ability: AppAbility,
  permission: PermissionKey,
): boolean {
  const mapped = PERMISSION_KEY_TO_CASL[permission];
  return ability.can(mapped.action, mapped.subject);
}

export function buildNavAbility(permissions: string[]): AppAbility {
  return defineAbilityFor({
    userId: 'imoveis-nav',
    permissions,
    isOrganizationOwner: false,
  });
}

export function canAccessNavHref(
  ability: AppAbility,
  href: string,
): boolean {
  const path = normalizePathname(href);
  if (path === '/') return ability.can('read', 'Dashboard');
  if (path === '/leads' || path.startsWith('/leads/')) {
    return ability.can('read', 'Lead');
  }
  if (path === '/properties' || path.startsWith('/properties/')) {
    return ability.can('read', 'Property');
  }
  if (path === '/calendar' || path.startsWith('/calendar/')) {
    return ability.can('read', 'Calendar');
  }
  if (path === '/transactions/finance' || path.startsWith('/transactions/finance')) {
    return ability.can('read', 'Finance');
  }
  if (path === '/transactions' || path.startsWith('/transactions/')) {
    return ability.can('read', 'Transaction');
  }
  if (path === '/settings' || path.startsWith('/settings')) {
    return true;
  }
  // Qualquer membro ativo (igual /settings). Explícito para não depender do fallback.
  if (path === '/help' || path.startsWith('/help')) {
    return true;
  }
  return true;
}

export function canAccessPathWithAbility(
  pathname: string,
  ability: AppAbility,
): boolean {
  return canAccessNavHref(ability, pathname);
}

export function canAccessSettingsSectionWithAbility(
  ability: AppAbility,
  section: string,
  isOrgOwner: boolean,
): boolean {
  if (isOrgOwner) return true;
  switch (section) {
    case 'profile':
    case 'privacy':
    case 'notifications':
      return true;
    case 'users':
      return (
        ability.can('read', 'Team') ||
        ability.can('manage', 'Team') ||
        ability.can('create', 'Team')
      );
    case 'system':
      return ability.can('read', 'Settings') || ability.can('manage', 'Settings');
    case 'billing':
      return ability.can('read', 'Billing');
    case 'delete-account':
      return isOrgOwner;
    default:
      return false;
  }
}
