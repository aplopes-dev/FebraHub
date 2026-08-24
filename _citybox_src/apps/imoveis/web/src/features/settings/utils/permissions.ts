/**
 * Enforcement de permissões mock — lê o usuário da sessão atual.
 */
import { getCurrentSessionUser } from '../services/settings-service';
import type { PermissionKey, ProfileTab, SettingsSection, TeamUser } from '../types';

/** Seções disponíveis para qualquer usuário ativo (não-admin). */
const PERSONAL_SETTINGS_SECTIONS: readonly SettingsSection[] = [
  'profile',
  'privacy',
  'notifications',
];

const ALL_SETTINGS_SECTIONS: readonly SettingsSection[] = [
  'profile',
  'privacy',
  'notifications',
  'users',
  'system',
  'billing',
  'delete-account',
];

export function canAccess(user: TeamUser | null, permission: PermissionKey): boolean {
  if (!user?.active) return false;
  return Boolean(user.permissions[permission]);
}

export function isSettingsAdmin(user: TeamUser | null): boolean {
  return Boolean(user?.active && user.role === 'admin');
}

export function getSessionPermissions(): TeamUser | null {
  return getCurrentSessionUser();
}

/** Qualquer usuário ativo pode abrir Configurações (escopo limitado se não for admin). */
export function canAccessAnySettings(user: TeamUser | null): boolean {
  return Boolean(user?.active);
}

/** Mapeia pathname do painel → permissão exigida (`null` = livre). */
export function getPermissionForPath(pathname: string): PermissionKey | null {
  if (pathname === '/') return null;
  if (pathname === '/help' || pathname.startsWith('/help/')) {
    return null;
  }
  if (pathname === '/settings' || pathname.startsWith('/settings/')) {
    return null;
  }
  if (pathname === '/leads' || pathname.startsWith('/leads/')) return 'leads';
  if (pathname === '/properties' || pathname.startsWith('/properties/')) return 'properties';
  if (pathname === '/calendar' || pathname.startsWith('/calendar/')) return 'calendar';
  if (pathname === '/transactions' || pathname.startsWith('/transactions/')) {
    return 'transactions';
  }
  return null;
}

export function canAccessPath(user: TeamUser | null, pathname: string): boolean {
  if (pathname === '/settings' || pathname.startsWith('/settings/')) {
    return canAccessAnySettings(user);
  }
  const permission = getPermissionForPath(pathname);
  if (!permission) return Boolean(user?.active);
  return canAccess(user, permission);
}

export function canAccessSettingsSection(
  user: TeamUser | null,
  section: SettingsSection,
): boolean {
  if (!user?.active) return false;
  if (isSettingsAdmin(user)) return true;
  return PERSONAL_SETTINGS_SECTIONS.includes(section);
}

export function getAccessibleSettingsSections(
  user: TeamUser | null,
): readonly SettingsSection[] {
  if (!user?.active) return [];
  if (isSettingsAdmin(user)) return ALL_SETTINGS_SECTIONS;
  return PERSONAL_SETTINGS_SECTIONS;
}

export function canAccessProfileTab(user: TeamUser | null, tab: ProfileTab): boolean {
  if (!user?.active) return false;
  if (!isSettingsAdmin(user)) {
    return tab === 'info' || tab === 'documents';
  }
  if (tab === 'properties') return canAccess(user, 'properties');
  if (tab === 'clients') return canAccess(user, 'leads');
  return true;
}

export function getAccessibleProfileTabs(user: TeamUser | null): readonly ProfileTab[] {
  if (!user?.active) return [];
  if (!isSettingsAdmin(user)) return ['info', 'documents'];
  const all: ProfileTab[] = [
    'info',
    'properties',
    'clients',
    'documents',
  ];
  return all.filter((tab) => canAccessProfileTab(user, tab));
}

export const NAV_PERMISSION: Record<string, PermissionKey | null> = {
  '/': null,
  '/help': null,
  '/leads': 'leads',
  '/properties': 'properties',
  '/transactions': 'transactions',
  '/calendar': 'calendar',
};

export function canAccessNavHref(user: TeamUser | null, href: string): boolean {
  const permission = NAV_PERMISSION[href];
  if (permission === null || permission === undefined) return Boolean(user?.active);
  return canAccess(user, permission);
}
