import type { Actions } from './actions.js';
import type { Subjects } from './subjects.js';
import type { Permission, PermissionModule } from './types.js';

function p(
  id: string,
  label: string,
  action: Actions,
  subject: Subjects,
  moduleId: string,
): Permission {
  return { id, label, action, subject, moduleId };
}

/**
 * Catálogo estático — fonte única de verdade (1ª leva, espelhando checkboxes da Equipe).
 * IDs estáveis = chaves booleanas (`leads`, `properties`, …).
 */
export const PERMISSIONS_MODULES: PermissionModule[] = [
  {
    id: 'vertical',
    name: 'Acesso à vertical',
    permissions: [
      p(
        'vertical_access',
        'Acessar Imóveis',
        'access',
        'Vertical',
        'vertical',
      ),
    ],
  },
  {
    id: 'leads',
    name: 'Leads',
    permissions: [p('leads', 'Leads e clientes', 'manage', 'Lead', 'leads')],
  },
  {
    id: 'properties',
    name: 'Imóveis',
    permissions: [
      p('properties', 'Cadastro de imóveis', 'manage', 'Property', 'properties'),
    ],
  },
  {
    id: 'calendar',
    name: 'Agenda',
    permissions: [
      p('calendar', 'Agenda e visitas', 'manage', 'Calendar', 'calendar'),
    ],
  },
  {
    id: 'transactions',
    name: 'Negócios',
    permissions: [
      p(
        'transactions',
        'Negócios e propostas',
        'manage',
        'Transaction',
        'transactions',
      ),
    ],
  },
  {
    id: 'finance',
    name: 'Financeiro',
    permissions: [
      p(
        'finance',
        'Financeiro e relatórios',
        'manage',
        'Finance',
        'finance',
      ),
    ],
  },
  {
    id: 'settings',
    name: 'Configurações',
    permissions: [
      p('settings', 'Configurações do sistema', 'manage', 'Settings', 'settings'),
      p('users', 'Usuários da equipe', 'manage', 'Team', 'settings'),
      p('billing', 'Faturamento', 'manage', 'Billing', 'settings'),
      p(
        'integrations',
        'Integrações (portais)',
        'manage',
        'Integration',
        'settings',
      ),
    ],
  },
];

export const ALL_PERMISSIONS = PERMISSIONS_MODULES.flatMap((m) => m.permissions);

/** UI Equipe — sem módulo SSO `vertical`. */
export const STORE_PERMISSIONS_MODULES = PERMISSIONS_MODULES.filter(
  (m) => m.id !== 'vertical',
);

export const STORE_PERMISSIONS = STORE_PERMISSIONS_MODULES.flatMap(
  (m) => m.permissions,
);

export const STORE_PERMISSION_IDS = STORE_PERMISSIONS.map((p) => p.id);

export const IMOVEL_PERMISSION_IDS = ALL_PERMISSIONS.map((p) => p.id);

export const PERMISSIONS_BY_ID = new Map(
  ALL_PERMISSIONS.map((permission) => [permission.id, permission]),
);

export function isValidPermissionId(id: string): boolean {
  return PERMISSIONS_BY_ID.has(id);
}

export function validatePermissionIds(ids: string[]): {
  valid: string[];
  invalid: string[];
} {
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const id of ids) {
    if (isValidPermissionId(id)) valid.push(id);
    else invalid.push(id);
  }
  return { valid, invalid };
}

export function expandPermissionIds(ids: readonly string[]): string[] {
  return [...new Set(ids.filter((id) => PERMISSIONS_BY_ID.has(id)))];
}
