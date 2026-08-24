'use client';

import { useMemo, useSyncExternalStore } from 'react';
import type { PermissionKey } from '@citybox/imoveis-permissions';
import { useAbility } from '@/features/imoveis/permissions/use-ability';
import {
  canAccessNavHref,
  canAccessPathWithAbility,
  canAccessSettingsSectionWithAbility,
  canPermissionKey,
} from '@/features/imoveis/lib/imoveis-nav-permissions';
import { useAuthSession } from '@/lib/session-context';
import { useStore } from '@/lib/store-context';
import {
  getSettingsVersion,
  subscribeSettings,
} from '../data/settings-store';
import {
  getSessionVersion,
  subscribeSession,
} from '../data/session-store';
import {
  getTeamCacheVersion,
  subscribeTeamCache,
} from '../data/team-members-cache';
import { getCurrentSessionUser } from '../services/settings-service';
import type { ProfileTab, SettingsSection, TeamUser } from '../types';
import {
  canAccess,
  canAccessAnySettings,
  canAccessNavHref as canAccessNavHrefMock,
  canAccessPath as canAccessPathMock,
  canAccessProfileTab,
  canAccessSettingsSection,
  getAccessibleProfileTabs,
  getAccessibleSettingsSections,
  getSessionPermissions,
} from '../utils/permissions';

function usePermissionRevision(): number {
  const settingsRevision = useSyncExternalStore(
    subscribeSettings,
    () => getSettingsVersion(),
    () => 0,
  );
  const sessionRevision = useSyncExternalStore(
    subscribeSession,
    () => getSessionVersion(),
    () => 0,
  );
  const teamRevision = useSyncExternalStore(
    subscribeTeamCache,
    () => getTeamCacheVersion(),
    () => 0,
  );
  return settingsRevision + sessionRevision + teamRevision;
}

export function useSessionPermissions() {
  const { status } = useAuthSession();
  const { storeId, accessibleStores } = useStore();
  const ability = useAbility();
  const revision = usePermissionRevision();

  const activeStore = useMemo(
    () => accessibleStores.find((s) => s.id === storeId),
    [accessibleStores, storeId],
  );

  const useCasl = status === 'authenticated' && Boolean(ability);

  const mockUser = useMemo(() => {
    void revision;
    return getSessionPermissions();
  }, [revision]);

  const user = useMemo((): TeamUser | null => {
    if (useCasl && activeStore) {
      return mockUser;
    }
    return mockUser;
  }, [activeStore, mockUser, useCasl]);

  return useMemo(() => {
    if (useCasl && ability) {
      const isOrgOwner = activeStore?.isOrganizationOwner === true;
      const allSections: SettingsSection[] = [
        'profile',
        'privacy',
        'notifications',
        'users',
        'system',
        'billing',
        'delete-account',
      ];
      const accessibleSettingsSections = allSections.filter((section) =>
        canAccessSettingsSectionWithAbility(ability, section, isOrgOwner),
      );
      return {
        user,
        revision,
        can: (permission: PermissionKey) => canPermissionKey(ability, permission),
        canPath: (pathname: string) =>
          canAccessPathWithAbility(pathname, ability),
        canNav: (href: string) => canAccessNavHref(ability, href),
        canSettings: (section: SettingsSection) =>
          canAccessSettingsSectionWithAbility(ability, section, isOrgOwner),
        canProfileTab: (tab: ProfileTab) => {
          if (tab === 'info') return true;
          if (tab === 'properties') return ability.can('read', 'Property');
          if (tab === 'clients') return ability.can('read', 'Lead');
          if (tab === 'documents') return true;
          return false;
        },
        canAnySettings: () => accessibleSettingsSections.length > 0,
        accessibleSettingsSections,
        accessibleProfileTabs: (() => {
          const tabs: ProfileTab[] = ['info'];
          if (ability.can('read', 'Property')) tabs.push('properties');
          if (ability.can('read', 'Lead')) tabs.push('clients');
          tabs.push('documents');
          return tabs;
        })(),
      };
    }

    return {
      user,
      revision,
      can: (permission: PermissionKey) => canAccess(user, permission),
      canPath: (pathname: string) => canAccessPathMock(user, pathname),
      canNav: (href: string) => canAccessNavHrefMock(user, href),
      canSettings: (section: SettingsSection) =>
        canAccessSettingsSection(user, section),
      canProfileTab: (tab: ProfileTab) => canAccessProfileTab(user, tab),
      canAnySettings: () => canAccessAnySettings(user),
      accessibleSettingsSections: getAccessibleSettingsSections(user),
      accessibleProfileTabs: getAccessibleProfileTabs(user),
    };
  }, [ability, activeStore, revision, useCasl, user]);
}

export type SessionPermissions = ReturnType<typeof useSessionPermissions>;

export { getSessionPermissions, canAccess, getCurrentSessionUser };
