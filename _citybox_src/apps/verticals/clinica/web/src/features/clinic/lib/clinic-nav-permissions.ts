import {
  defineAbilityFor,
  type Actions,
  type AppAbility,
  type Subjects,
} from '@citybox/clinica-permissions';
import { canAccessWithAnyOf } from '@/lib/vertical/permissions-utils';
import {
  findNavByPathAccessible,
  verticalBasePath,
} from '@/lib/vertical/navigation-utils';
import type {
  VerticalNavLeaf,
  VerticalNavModule,
  VerticalNavPermissionsApi,
} from '@/lib/vertical/types';
import {
  canAccessClinicProfileSettings,
  canAccessSettingsTab,
  firstAllowedSettingsPath,
  isClinicProfileSettingsPath,
} from './clinic-settings-access';
import {
  canAccessPatientFicha,
  isPatientDetailPath,
  isPatientListPath,
} from './patient-list-access';

const SETTINGS_BASE = '/configuracoes';

function normalizePathname(pathname: string): string {
  const path = pathname.split('?')[0] ?? pathname;
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
}

function isSettingsPath(pathname: string): boolean {
  const path = normalizePathname(pathname);
  return path === SETTINGS_BASE || path.startsWith(`${SETTINGS_BASE}/`);
}

/**
 * Gate de menu por acesso ao módulo (IDs finos → CASL).
 * Catálogo: `@citybox/clinica-permissions`.
 */
type AbilityCheck = { action: Actions; subject: Subjects };

type LeafRequirement =
  | { kind: 'one'; action: Actions; subject: Subjects }
  | { kind: 'any'; action: Actions; subjects: readonly Subjects[] }
  | { kind: 'anyCheck'; checks: readonly AbilityCheck[] };

/** Acesso ao módulo: `access`/`read` ou qualquer operação no subject. */
const MODULE_ACCESS = (
  subject: Subjects,
  extra: readonly AbilityCheck[] = [],
): LeafRequirement => ({
  kind: 'anyCheck',
  checks: [
    { action: 'access', subject },
    { action: 'read', subject },
    { action: 'create', subject },
    { action: 'update', subject },
    { action: 'delete', subject },
    { action: 'manage', subject },
    ...extra,
  ],
});

const LEAF_REQUIREMENTS: Record<string, LeafRequirement> = {
  'visao-geral': MODULE_ACCESS('Dashboard'),
  // Pacientes (lista): sempre no menu — ver `pathAllowed` / `access` Patient.
  /** Só o checkbox `schedule_view_menu` — outras permissões de Agenda não abrem o menu. */
  agenda: { kind: 'one', action: 'access', subject: 'Schedule' },
  vendas: MODULE_ACCESS('Sales'),
  marketing: MODULE_ACCESS('Marketing'),
  estoque: MODULE_ACCESS('Stock'),
  financeiro: {
    kind: 'anyCheck',
    checks: [
      // `read Financial` (resumo) NÃO abre o menu — é plus dos cards.
      { action: 'read', subject: 'FinancialIncome' },
      { action: 'create', subject: 'FinancialIncome' },
      { action: 'update', subject: 'FinancialIncome' },
      { action: 'delete', subject: 'FinancialIncome' },
      { action: 'settle', subject: 'FinancialIncome' },
      { action: 'settleFuture', subject: 'FinancialIncome' },
      { action: 'settleRetroactive', subject: 'FinancialIncome' },
      { action: 'read', subject: 'FinancialExpense' },
      { action: 'create', subject: 'FinancialExpense' },
      { action: 'update', subject: 'FinancialExpense' },
      { action: 'delete', subject: 'FinancialExpense' },
      { action: 'settle', subject: 'FinancialExpense' },
      { action: 'read', subject: 'FinancialCommission' },
      { action: 'update', subject: 'FinancialCommission' },
      { action: 'settle', subject: 'FinancialCommission' },
      // Configurações (contas/categorias) também abre o menu Financeiro.
      { action: 'create', subject: 'FinancialAccount' },
      { action: 'delete', subject: 'FinancialAccount' },
      { action: 'create', subject: 'FinancialCategory' },
      { action: 'delete', subject: 'FinancialCategory' },
    ],
  },
  // Configurações: sempre no sidebar (Equipe read-only sem checkboxes).
};

function buildAbility(permissions: string[]): AppAbility {
  return defineAbilityFor({
    userId: 'clinic-nav',
    permissions,
    isOrganizationOwner: false,
  });
}

function leafAllowed(leaf: VerticalNavLeaf, ability: AppAbility): boolean {
  const requirement = LEAF_REQUIREMENTS[leaf.id];
  if (!requirement) return true;
  if (requirement.kind === 'one') {
    return ability.can(requirement.action, requirement.subject);
  }
  if (requirement.kind === 'any') {
    return requirement.subjects.some((subject) =>
      ability.can(requirement.action, subject),
    );
  }
  return requirement.checks.some((check) =>
    ability.can(check.action, check.subject),
  );
}

function isDashboardPath(pathname: string): boolean {
  const path = normalizePathname(pathname);
  return path === '/' || path === '/relatorios' || path === '/tarefas';
}

/** Indicadores/Relatórios = read; Tarefas = access. */
function canAccessDashboardPath(
  pathname: string,
  ability: AppAbility,
): boolean {
  const path = normalizePathname(pathname);
  if (path === '/tarefas') return ability.can('access', 'Dashboard');
  if (path === '/' || path === '/relatorios') {
    return ability.can('read', 'Dashboard');
  }
  return false;
}

/**
 * Sem indicadores, o link do sidebar aponta para Tarefas se liberada.
 */
function rewriteDashboardLeafPath(
  leaf: VerticalNavLeaf,
  ability: AppAbility,
): VerticalNavLeaf {
  if (leaf.id !== 'visao-geral') return leaf;
  if (ability.can('read', 'Dashboard')) return leaf;
  if (ability.can('access', 'Dashboard')) {
    return { ...leaf, path: '/tarefas' };
  }
  return leaf;
}

/**
 * Sem `settings_manage`, o link do sidebar aponta para a 1ª aba liberada
 * (Equipe é o fallback permanente).
 */
function rewriteSettingsLeafPath(
  leaf: VerticalNavLeaf,
  permissions: string[],
): VerticalNavLeaf {
  if (leaf.id !== 'configuracoes') return leaf;
  if (canAccessClinicProfileSettings(permissions)) return leaf;
  const fallback = firstAllowedSettingsPath(permissions);
  if (fallback === leaf.path) return leaf;
  return { ...leaf, path: fallback };
}

function pathAllowed(
  pathname: string,
  leaf: VerticalNavLeaf,
  permissions: string[],
  ability: AppAbility,
): boolean {
  // Configurações: gate por aba (Equipe sempre; demais exigem checkbox).
  if (isSettingsPath(pathname)) {
    if (isClinicProfileSettingsPath(pathname)) {
      return canAccessClinicProfileSettings(permissions);
    }
    return canAccessSettingsTab(permissions, normalizePathname(pathname));
  }
  // Lista de pacientes: sempre (access Patient).
  if (isPatientListPath(pathname)) {
    return ability.can('access', 'Patient');
  }
  // Ficha do paciente: exige algum checkbox da ficha.
  if (isPatientDetailPath(pathname)) {
    return canAccessPatientFicha(ability);
  }
  // Dashboard: Indicadores/Relatórios vs Tarefas.
  if (isDashboardPath(pathname)) {
    return canAccessDashboardPath(pathname, ability);
  }
  return leafAllowed(leaf, ability);
}

/**
 * Navegação da clínica filtrada pelos IDs CASL do vínculo (`members/me`).
 */
export function createClinicNavPermissions(): VerticalNavPermissionsApi {
  const basePath = verticalBasePath('clinic');

  return {
    canAccessWithAnyOf,

    filterNavModules(modules: VerticalNavModule[], permissions: string[]) {
      if (permissions.length === 0) return [];
      const ability = buildAbility(permissions);
      return modules
        .map((module) => ({
          ...module,
          children: module.children
            .filter((leaf) => leafAllowed(leaf, ability))
            .map((leaf) =>
              rewriteDashboardLeafPath(
                rewriteSettingsLeafPath(leaf, permissions),
                ability,
              ),
            ),
        }))
        .filter((module) => module.children.length > 0);
    },

    canAccessPath(pathname, modules, permissions) {
      if (permissions.length === 0) return false;
      const hit = findNavByPathAccessible(pathname, modules, basePath);
      if (!hit) return false;
      return pathAllowed(
        pathname,
        hit.leaf,
        permissions,
        buildAbility(permissions),
      );
    },

    canWritePath(pathname, modules, permissions) {
      if (permissions.length === 0) return false;
      const hit = findNavByPathAccessible(pathname, modules, basePath);
      if (!hit) return false;
      if (!pathAllowed(pathname, hit.leaf, permissions, buildAbility(permissions))) {
        return false;
      }
      const path = normalizePathname(pathname);
      if (path === `${SETTINGS_BASE}/equipe` || path.startsWith(`${SETTINGS_BASE}/equipe/`)) {
        const ability = buildAbility(permissions);
        return (
          ability.can('create', 'Team') ||
          ability.can('update', 'Team') ||
          ability.can('delete', 'Team')
        );
      }
      return true;
    },
  };
}
