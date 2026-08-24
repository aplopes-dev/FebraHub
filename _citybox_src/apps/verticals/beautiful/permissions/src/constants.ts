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

export const PERMISSIONS_MODULES: PermissionModule[] = [
  {
    id: 'vertical',
    name: 'Acesso à vertical',
    permissions: [
      p(
        'vertical_access',
        'Acessar a vertical Beautiful',
        'access',
        'Vertical',
        'vertical',
      ),
    ],
  },
  {
    id: 'schedule',
    name: 'Agenda',
    permissions: [
      p(
        'schedule_view_menu',
        'Ver e acessar menu agenda',
        'access',
        'Schedule',
        'schedule',
      ),
      p(
        'schedule_attend',
        'Fazer atendimentos (aparecer como profissional)',
        'update',
        'Schedule',
        'schedule',
      ),
      p(
        'schedule_view_all',
        'Ver agenda de todos os profissionais',
        'read',
        'Schedule',
        'schedule',
      ),
      p(
        'schedule_create_for_others',
        'Criar agendamentos para outros profissionais',
        'create',
        'Schedule',
        'schedule',
      ),
      p(
        'schedule_delete',
        'Cancelar / excluir agendamentos',
        'delete',
        'Schedule',
        'schedule',
      ),
    ],
  },
  {
    id: 'clients',
    name: 'Clientes',
    permissions: [
      p('client_create', 'Cadastrar cliente', 'create', 'Client', 'clients'),
      p('client_read', 'Visualizar clientes', 'read', 'Client', 'clients'),
      p('client_update', 'Editar cliente', 'update', 'Client', 'clients'),
      p('client_delete', 'Excluir cliente', 'delete', 'Client', 'clients'),
    ],
  },
  {
    id: 'services',
    name: 'Catálogo · Serviços',
    permissions: [
      p(
        'service_create',
        'Cadastrar serviço',
        'create',
        'Service',
        'services',
      ),
      p('service_read', 'Visualizar serviços', 'read', 'Service', 'services'),
      p('service_update', 'Editar serviço', 'update', 'Service', 'services'),
      p('service_delete', 'Excluir serviço', 'delete', 'Service', 'services'),
    ],
  },
  {
    id: 'stock',
    name: 'Catálogo · Estoque',
    permissions: [
      p('stock_access', 'Acessar estoque', 'access', 'Stock', 'stock'),
      p(
        'product_create',
        'Cadastrar produto / insumo',
        'create',
        'Product',
        'stock',
      ),
      p(
        'product_read',
        'Visualizar produtos / insumos',
        'read',
        'Product',
        'stock',
      ),
      p(
        'product_update',
        'Editar produto / insumo',
        'update',
        'Product',
        'stock',
      ),
      p(
        'product_delete',
        'Excluir produto / insumo',
        'delete',
        'Product',
        'stock',
      ),
      p(
        'stock_adjust',
        'Ajustar estoque (entradas / saídas)',
        'update',
        'Stock',
        'stock',
      ),
    ],
  },
  {
    id: 'settings',
    name: 'Equipe e Configurações',
    permissions: [
      p(
        'settings_team_create',
        'Adicionar membros da equipe',
        'create',
        'Team',
        'settings',
      ),
      p(
        'settings_team_update',
        'Editar membros da equipe',
        'update',
        'Team',
        'settings',
      ),
      p(
        'settings_team_inactivate',
        'Inativar membros da equipe',
        'delete',
        'Team',
        'settings',
      ),
      p(
        'settings_manage',
        'Configurações da loja (identidade, logo, horário)',
        'manage',
        'Settings',
        'settings',
      ),
      p(
        'settings_categories_create',
        'Cadastrar categorias',
        'create',
        'Category',
        'settings',
      ),
      p(
        'settings_categories_update',
        'Editar / excluir categorias',
        'update',
        'Category',
        'settings',
      ),
    ],
  },
  {
    id: 'financial',
    name: 'Financeiro',
    permissions: [
      p(
        'financial_access',
        'Acessar financeiro',
        'access',
        'Financial',
        'financial',
      ),
    ],
  },
];

export const ALL_PERMISSIONS: Permission[] = PERMISSIONS_MODULES.flatMap(
  (m) => m.permissions,
);

/** Módulos exibidos na UI de equipe (exclui gate SSO `vertical_access`). */
export const STORE_PERMISSIONS_MODULES: PermissionModule[] =
  PERMISSIONS_MODULES.filter((m) => m.id !== 'vertical');

export const STORE_PERMISSIONS: Permission[] =
  STORE_PERMISSIONS_MODULES.flatMap((m) => m.permissions);

export const STORE_PERMISSION_IDS: readonly string[] = STORE_PERMISSIONS.map(
  (p) => p.id,
);

export const PERMISSION_ALIASES: Record<string, readonly string[]> = {
  schedule_manage: STORE_PERMISSIONS.filter(
    (x) => x.moduleId === 'schedule',
  ).map((x) => x.id),
  clients_manage: STORE_PERMISSIONS.filter((x) => x.moduleId === 'clients').map(
    (x) => x.id,
  ),
  settings_team: [
    'settings_team_create',
    'settings_team_update',
    'settings_team_inactivate',
  ],
  settings_categories: [
    'settings_categories_create',
    'settings_categories_update',
  ],
};

export const LEGACY_COARSE_PERMISSION_IDS = [
  'schedule_manage',
  'clients_manage',
  'settings_team',
  'settings_categories',
] as const;

export const PERMISSIONS_BY_ID = new Map(
  ALL_PERMISSIONS.map((perm) => [perm.id, perm] as const),
);

export function isValidPermissionId(id: string): boolean {
  return (
    PERMISSIONS_BY_ID.has(id) ||
    (LEGACY_COARSE_PERMISSION_IDS as readonly string[]).includes(id)
  );
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

/** Expande aliases grossos para IDs finos (deduplicado, ordem estável). */
export function expandPermissionIds(ids: readonly string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  const pushFine = (next: string) => {
    if (seen.has(next)) return;
    if (!PERMISSIONS_BY_ID.has(next)) return;
    seen.add(next);
    out.push(next);
  };

  for (const id of ids) {
    const alias = PERMISSION_ALIASES[id];
    if (alias) {
      for (const next of alias) pushFine(next);
      continue;
    }
    pushFine(id);
  }
  return out;
}

export const BEAUTIFUL_PERMISSION_IDS = {
  verticalAccess: 'vertical_access',
  scheduleViewMenu: 'schedule_view_menu',
  scheduleAttend: 'schedule_attend',
  scheduleViewAll: 'schedule_view_all',
  scheduleCreateForOthers: 'schedule_create_for_others',
  scheduleDelete: 'schedule_delete',
  clientCreate: 'client_create',
  clientRead: 'client_read',
  clientUpdate: 'client_update',
  clientDelete: 'client_delete',
  serviceCreate: 'service_create',
  serviceRead: 'service_read',
  serviceUpdate: 'service_update',
  serviceDelete: 'service_delete',
  stockAccess: 'stock_access',
  productCreate: 'product_create',
  productRead: 'product_read',
  productUpdate: 'product_update',
  productDelete: 'product_delete',
  stockAdjust: 'stock_adjust',
  settingsTeamCreate: 'settings_team_create',
  settingsTeamUpdate: 'settings_team_update',
  settingsTeamInactivate: 'settings_team_inactivate',
  settingsManage: 'settings_manage',
  settingsCategoriesCreate: 'settings_categories_create',
  settingsCategoriesUpdate: 'settings_categories_update',
  financialAccess: 'financial_access',
} as const;
