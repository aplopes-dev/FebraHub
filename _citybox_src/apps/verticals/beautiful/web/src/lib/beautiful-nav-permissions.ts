import {
  defineAbilityFor,
  type Actions,
  type AppAbility,
  type Subjects,
} from '@citybox/beautiful-permissions';
import {
  BEAUTIFUL_CATALOG_TABS,
  BEAUTIFUL_FINANCEIRO_TABS,
  BEAUTIFUL_SETTINGS_TABS,
  isCatalogTabActive,
  isFinanceiroTabActive,
  isSettingsTabActive,
  type BeautifulCatalogTab,
  type BeautifulFinanceiroTab,
  type BeautifulNavModule,
  type BeautifulNavSection,
  type BeautifulSettingsTab,
} from './navigation';

type AbilityCheck = { action: Actions; subject: Subjects };

const MODULE_REQUIREMENTS: Record<string, AbilityCheck | AbilityCheck[]> = {
  home: [], // sem gate fino
  agenda: { action: 'access', subject: 'Schedule' },
  clientes: { action: 'read', subject: 'Client' },
  catalogo: [
    { action: 'read', subject: 'Service' },
    { action: 'read', subject: 'Product' },
    { action: 'access', subject: 'Stock' },
  ],
  financeiro: { action: 'access', subject: 'Financial' },
  equipe: { action: 'read', subject: 'Team' },
  settings: [
    { action: 'manage', subject: 'Settings' },
    { action: 'create', subject: 'Category' },
    { action: 'update', subject: 'Category' },
  ],
  plan: [], // sem gate fino
};

function buildAbility(
  permissions: string[],
  isOrganizationOwner: boolean,
): AppAbility {
  return defineAbilityFor({
    userId: 'beautiful-nav',
    permissions,
    isOrganizationOwner,
  });
}

function moduleAllowed(
  moduleId: string,
  ability: AppAbility,
): boolean {
  const req = MODULE_REQUIREMENTS[moduleId];
  if (!req || (Array.isArray(req) && req.length === 0)) return true;
  const checks = Array.isArray(req) ? req : [req];
  return checks.some((c) => ability.can(c.action, c.subject));
}

export function filterBeautifulNavSections(
  sections: BeautifulNavSection[],
  permissions: string[],
  isOrganizationOwner: boolean,
): BeautifulNavSection[] {
  const ability = buildAbility(permissions, isOrganizationOwner);
  return sections
    .map((section) => ({
      ...section,
      modules: section.modules.filter((mod) =>
        moduleAllowed(mod.id, ability),
      ),
    }))
    .filter((section) => section.modules.length > 0);
}

export function filterBeautifulFooterModules(
  modules: BeautifulNavModule[],
  permissions: string[],
  isOrganizationOwner: boolean,
): BeautifulNavModule[] {
  const ability = buildAbility(permissions, isOrganizationOwner);
  return modules.filter((mod) => moduleAllowed(mod.id, ability));
}

export function canAccessCatalogTab(
  tabId: string,
  permissions: string[],
  isOrganizationOwner: boolean,
): boolean {
  const ability = buildAbility(permissions, isOrganizationOwner);
  if (tabId === 'servicos') {
    return (
      ability.can('read', 'Service') ||
      ability.can('create', 'Service') ||
      ability.can('update', 'Service') ||
      ability.can('delete', 'Service')
    );
  }
  if (tabId === 'estoque') {
    return (
      ability.can('access', 'Stock') ||
      ability.can('read', 'Product') ||
      ability.can('create', 'Product') ||
      ability.can('update', 'Product') ||
      ability.can('delete', 'Product')
    );
  }
  return true;
}

/** Abas do Financeiro — hoje liberadas com `access` Financial (mock UI). */
export function canAccessFinanceiroTab(
  _tabId: string,
  permissions: string[],
  isOrganizationOwner: boolean,
): boolean {
  const ability = buildAbility(permissions, isOrganizationOwner);
  return ability.can('access', 'Financial');
}

export function canAccessSettingsTab(
  tabId: string,
  permissions: string[],
  isOrganizationOwner: boolean,
): boolean {
  const ability = buildAbility(permissions, isOrganizationOwner);
  if (tabId === 'geral' || tabId === 'horario' || tabId === 'aparencia') {
    return ability.can('manage', 'Settings');
  }
  if (tabId === 'categoria-clientes' || tabId === 'categoria-agendamento') {
    // `read` Category é sempre concedido — tabs de mutação exigem create/update.
    return (
      ability.can('create', 'Category') || ability.can('update', 'Category')
    );
  }
  return true;
}

export function listAllowedSettingsTabs(
  permissions: string[],
  isOrganizationOwner: boolean,
): BeautifulSettingsTab[] {
  return BEAUTIFUL_SETTINGS_TABS.filter((tab) =>
    canAccessSettingsTab(tab.id, permissions, isOrganizationOwner),
  );
}

export function listAllowedCatalogTabs(
  permissions: string[],
  isOrganizationOwner: boolean,
): BeautifulCatalogTab[] {
  return BEAUTIFUL_CATALOG_TABS.filter((tab) =>
    canAccessCatalogTab(tab.id, permissions, isOrganizationOwner),
  );
}

/** Primeira aba de Configurações liberada (ordem do catálogo de tabs). */
export function firstAllowedSettingsPath(
  permissions: string[],
  isOrganizationOwner: boolean,
): string | null {
  return (
    listAllowedSettingsTabs(permissions, isOrganizationOwner)[0]?.path ?? null
  );
}

/** Primeira aba de Catálogo liberada. */
export function firstAllowedCatalogPath(
  permissions: string[],
  isOrganizationOwner: boolean,
): string | null {
  return (
    listAllowedCatalogTabs(permissions, isOrganizationOwner)[0]?.path ?? null
  );
}

export function listAllowedFinanceiroTabs(
  permissions: string[],
  isOrganizationOwner: boolean,
): BeautifulFinanceiroTab[] {
  return BEAUTIFUL_FINANCEIRO_TABS.filter((tab) =>
    canAccessFinanceiroTab(tab.id, permissions, isOrganizationOwner),
  );
}

/** Primeira aba do Financeiro liberada. */
export function firstAllowedFinanceiroPath(
  permissions: string[],
  isOrganizationOwner: boolean,
): string | null {
  return (
    listAllowedFinanceiroTabs(permissions, isOrganizationOwner)[0]?.path ??
    null
  );
}

/**
 * Path do item de menu: para Catálogo/Configurações aponta à 1ª aba autorizada
 * (evita cair na aba default sem permissão).
 */
export function resolveBeautifulModulePath(
  moduleId: string,
  defaultPath: string,
  permissions: string[],
  isOrganizationOwner: boolean,
): string {
  if (moduleId === 'settings') {
    return (
      firstAllowedSettingsPath(permissions, isOrganizationOwner) ?? defaultPath
    );
  }
  if (moduleId === 'catalogo') {
    return (
      firstAllowedCatalogPath(permissions, isOrganizationOwner) ?? defaultPath
    );
  }
  if (moduleId === 'financeiro') {
    return (
      firstAllowedFinanceiroPath(permissions, isOrganizationOwner) ??
      defaultPath
    );
  }
  return defaultPath;
}

export function isAllowedSettingsPathname(
  pathname: string,
  permissions: string[],
  isOrganizationOwner: boolean,
): boolean {
  return listAllowedSettingsTabs(permissions, isOrganizationOwner).some((tab) =>
    isSettingsTabActive(tab.path, pathname),
  );
}

export function isAllowedCatalogPathname(
  pathname: string,
  permissions: string[],
  isOrganizationOwner: boolean,
): boolean {
  return listAllowedCatalogTabs(permissions, isOrganizationOwner).some((tab) =>
    isCatalogTabActive(tab.path, pathname),
  );
}

export function isAllowedFinanceiroPathname(
  pathname: string,
  permissions: string[],
  isOrganizationOwner: boolean,
): boolean {
  return listAllowedFinanceiroTabs(permissions, isOrganizationOwner).some(
    (tab) => isFinanceiroTabActive(tab.path, pathname),
  );
}
