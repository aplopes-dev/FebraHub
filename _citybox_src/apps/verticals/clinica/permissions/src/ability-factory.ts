import { Ability, AbilityBuilder } from '@casl/ability';
import type { Actions } from './actions.js';
import { expandPermissionIds } from './constants.js';
import { mapPermissionsToCasl } from './permission-mapper.js';
import type { AppAbility, Subjects } from './subjects.js';
import type { UserPermissions } from './types.js';

/**
 * Subjects cujo gate Nest ainda é `manage` na 1ª leva.
 * Qualquer ability (access/CRUD) nesses subjects também concede `manage`
 * para não quebrar rotas até o enforcement fino por rota.
 *
 * Financial / FinancialIncome / FinancialExpense / FinancialCommission /
 * FinancialAccount / FinancialCategory / **Sales** ficam fora — catálogo fino.
 */
const MANAGE_BRIDGE_SUBJECTS = new Set<Subjects>([
  'PatientDocument',
  'PatientAnamnesis',
  'PatientTreatment',
  'Settings',
  'Stock',
  'ClinicPlan',
  'AnamnesisTemplate',
  'ContractModel',
]);

export function defineAbilityFor(user: UserPermissions): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(Ability);

  if (user.isOrganizationOwner) {
    can('manage', 'all');
    return build();
  }

  // Lista de pacientes: disponível para todo membro da clínica (sem checkbox).
  can('access', 'Patient');
  // Equipe (listagem): sempre visível em Configurações — ações exigem checkboxes.
  can('read', 'Team');
  // Categorias (listagem / selects): leitura sempre; CRUD exige settings_categories_*.
  can('read', 'Category');

  const expanded = expandPermissionIds(user.permissions);
  const mappings = mapPermissionsToCasl(user.permissions);
  const bridged = new Set<Subjects>();
  let teamWrite = false;
  let marketingWrite = false;
  let patientFileAccess = false;
  let incomeWrite = false;
  let expenseWrite = false;
  let commissionWrite = false;
  let accountAccess = false;
  let categoryAccess = false;

  for (const { action, subject } of mappings) {
    can(action, subject);
    if (MANAGE_BRIDGE_SUBJECTS.has(subject)) {
      bridged.add(subject);
    }
    if (subject === 'Team' && action !== 'read') {
      teamWrite = true;
    }
    if (subject === 'Marketing' && action !== 'read') {
      marketingWrite = true;
    }
    if (subject === 'PatientFile') {
      patientFileAccess = true;
    }
    if (subject === 'FinancialIncome' && action !== 'read') {
      incomeWrite = true;
    }
    if (subject === 'FinancialExpense' && action !== 'read') {
      expenseWrite = true;
    }
    if (subject === 'FinancialCommission' && action !== 'read') {
      commissionWrite = true;
    }
    if (subject === 'FinancialAccount') {
      accountAccess = true;
    }
    if (subject === 'FinancialCategory') {
      categoryAccess = true;
    }
  }

  // Pagar/receber vale para receita e despesa (um checkbox).
  if (expanded.includes('financial_pay_receive')) {
    can('settle', 'FinancialIncome');
    can('settle', 'FinancialExpense');
  }

  // Listagem da equipe: qualquer ação de escrita também permite ler.
  if (teamWrite) {
    can('read', 'Team');
  }

  // Criar/editar/excluir campanha também permite listar/ver.
  if (marketingWrite) {
    can('read', 'Marketing');
  }

  // Qualquer patient_file_* (create/update/delete) libera listar/baixar o drive.
  if (patientFileAccess) {
    can('read', 'PatientFile');
  }

  // Escrita em receita/despesa também permite listar o próprio tipo.
  if (incomeWrite) {
    can('read', 'FinancialIncome');
  }
  if (expenseWrite) {
    can('read', 'FinancialExpense');
  }
  if (commissionWrite) {
    can('read', 'FinancialCommission');
  }

  // Contas/categorias: create ou delete também permite listar (Configurações).
  if (accountAccess) {
    can('read', 'FinancialAccount');
  }
  if (categoryAccess) {
    can('read', 'FinancialCategory');
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
