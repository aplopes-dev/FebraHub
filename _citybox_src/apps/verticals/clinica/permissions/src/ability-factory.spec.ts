import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  canUser,
  defineAbilityFor,
  expandPermissionIds,
  isValidPermissionId,
  permissionsForRole,
  STORE_PERMISSION_IDS,
  validatePermissionIds,
} from './index.js';

describe('defineAbilityFor', () => {
  it('owner bypasses with manage all', () => {
    const ability = defineAbilityFor({
      userId: 'u1',
      permissions: [],
      isOrganizationOwner: true,
    });
    assert.equal(ability.can('manage', 'Team'), true);
    assert.equal(ability.can('manage', 'Patient'), true);
    assert.equal(ability.can('access', 'Vertical'), true);
  });

  it('grants only mapped permissions', () => {
    const ability = defineAbilityFor({
      userId: 'u2',
      permissions: ['settings_team_create', 'schedule_view_menu'],
    });
    assert.equal(ability.can('create', 'Team'), true);
    assert.equal(ability.can('read', 'Team'), true);
    assert.equal(ability.can('update', 'Team'), false);
    assert.equal(ability.can('access', 'Schedule'), true);
    assert.equal(ability.can('manage', 'Schedule'), false);
    assert.equal(ability.can('access', 'Patient'), true); // lista sempre
    assert.equal(ability.can('read', 'Patient'), false);
    assert.equal(ability.can('manage', 'Patient'), false);
    assert.equal(ability.can('manage', 'Settings'), false);
  });

  it('always grants Team read, Category read and Patient access without checkboxes', () => {
    const ability = defineAbilityFor({
      userId: 'u2empty',
      permissions: [],
    });
    assert.equal(ability.can('read', 'Team'), true);
    assert.equal(ability.can('create', 'Team'), false);
    assert.equal(ability.can('update', 'Team'), false);
    assert.equal(ability.can('delete', 'Team'), false);
    assert.equal(ability.can('read', 'Category'), true);
    assert.equal(ability.can('create', 'Category'), false);
    assert.equal(ability.can('update', 'Category'), false);
    assert.equal(ability.can('access', 'Patient'), true);
  });

  it('settings_manage does not grant Category create/update', () => {
    const ability = defineAbilityFor({
      userId: 'u-settings',
      permissions: ['settings_manage'],
    });
    assert.equal(ability.can('manage', 'Settings'), true);
    assert.equal(ability.can('create', 'Category'), false);
    assert.equal(ability.can('update', 'Category'), false);
    assert.equal(ability.can('manage', 'Category'), false);
  });

  it('settings_categories_update grants update Category only', () => {
    const ability = defineAbilityFor({
      userId: 'u-cat',
      permissions: ['settings_categories_update'],
    });
    assert.equal(ability.can('update', 'Category'), true);
    assert.equal(ability.can('create', 'Category'), false);
    assert.equal(ability.can('manage', 'Category'), false);
  });

  it('Financial fine permissions do not unlock each other via manage bridge', () => {
    const summaryOnly = defineAbilityFor({
      userId: 'u-fin-sum',
      permissions: ['financial_summary'],
    });
    assert.equal(summaryOnly.can('read', 'Financial'), true);
    assert.equal(summaryOnly.can('manage', 'Financial'), false);
    assert.equal(summaryOnly.can('create', 'FinancialIncome'), false);
    assert.equal(summaryOnly.can('create', 'FinancialExpense'), false);

    const incomeCreateOnly = defineAbilityFor({
      userId: 'u-fin-inc',
      permissions: ['financial_income_create'],
    });
    assert.equal(incomeCreateOnly.can('create', 'FinancialIncome'), true);
    assert.equal(incomeCreateOnly.can('read', 'FinancialIncome'), true);
    assert.equal(incomeCreateOnly.can('create', 'FinancialExpense'), false);
    assert.equal(incomeCreateOnly.can('manage', 'Financial'), false);
    assert.equal(incomeCreateOnly.can('settle', 'FinancialIncome'), false);

    const payReceive = defineAbilityFor({
      userId: 'u-fin-settle',
      permissions: ['financial_pay_receive'],
    });
    assert.equal(payReceive.can('settle', 'FinancialIncome'), true);
    assert.equal(payReceive.can('settle', 'FinancialExpense'), true);
    assert.equal(payReceive.can('create', 'FinancialIncome'), false);
  });

  it('commission_all does not grant pay; commission_pay does not grant view all', () => {
    const viewAll = defineAbilityFor({
      userId: 'u-comm-all',
      permissions: ['financial_commission_all'],
    });
    assert.equal(viewAll.can('update', 'FinancialCommission'), true);
    assert.equal(viewAll.can('read', 'FinancialCommission'), true);
    assert.equal(viewAll.can('settle', 'FinancialCommission'), false);
    assert.equal(viewAll.can('manage', 'FinancialCommission'), false);

    const payOnly = defineAbilityFor({
      userId: 'u-comm-pay',
      permissions: ['financial_commission_pay'],
    });
    assert.equal(payOnly.can('settle', 'FinancialCommission'), true);
    assert.equal(payOnly.can('update', 'FinancialCommission'), false);
    assert.equal(payOnly.can('read', 'FinancialCommission'), true);
  });

  it('account/category create|delete grant read and do not unlock income CRUD', () => {
    const createAccount = defineAbilityFor({
      userId: 'u-acc',
      permissions: ['financial_account_create'],
    });
    assert.equal(createAccount.can('create', 'FinancialAccount'), true);
    assert.equal(createAccount.can('read', 'FinancialAccount'), true);
    assert.equal(createAccount.can('delete', 'FinancialAccount'), false);
    assert.equal(createAccount.can('update', 'FinancialIncome'), false);

    const deleteCategory = defineAbilityFor({
      userId: 'u-cat-fin',
      permissions: ['financial_category_delete'],
    });
    assert.equal(deleteCategory.can('delete', 'FinancialCategory'), true);
    assert.equal(deleteCategory.can('read', 'FinancialCategory'), true);
    assert.equal(deleteCategory.can('create', 'FinancialCategory'), false);
  });

  it('PatientPrescription and PatientCertificate create do not imply manage', () => {
    const prescriptionOnly = defineAbilityFor({
      userId: 'u-rx',
      permissions: ['patient_prescription_create'],
    });
    assert.equal(prescriptionOnly.can('create', 'PatientPrescription'), true);
    assert.equal(prescriptionOnly.can('manage', 'PatientPrescription'), false);
    assert.equal(prescriptionOnly.can('create', 'PatientCertificate'), false);
    assert.equal(prescriptionOnly.can('manage', 'PatientDocument'), false);

    const certificateOnly = defineAbilityFor({
      userId: 'u-cert',
      permissions: ['patient_certificate_create'],
    });
    assert.equal(certificateOnly.can('create', 'PatientCertificate'), true);
    assert.equal(certificateOnly.can('manage', 'PatientCertificate'), false);
    assert.equal(certificateOnly.can('create', 'PatientPrescription'), false);
  });

  it('PatientFile fine actions do not imply manage or each other', () => {
    const createOnly = defineAbilityFor({
      userId: 'u-file-create',
      permissions: ['patient_file_create'],
    });
    assert.equal(createOnly.can('create', 'PatientFile'), true);
    assert.equal(createOnly.can('read', 'PatientFile'), true);
    assert.equal(createOnly.can('update', 'PatientFile'), false);
    assert.equal(createOnly.can('delete', 'PatientFile'), false);
    assert.equal(createOnly.can('manage', 'PatientFile'), false);

    const updateOnly = defineAbilityFor({
      userId: 'u-file-update',
      permissions: ['patient_file_manage'],
    });
    assert.equal(updateOnly.can('update', 'PatientFile'), true);
    assert.equal(updateOnly.can('read', 'PatientFile'), true);
    assert.equal(updateOnly.can('create', 'PatientFile'), false);
    assert.equal(updateOnly.can('delete', 'PatientFile'), false);
    assert.equal(updateOnly.can('manage', 'PatientFile'), false);

    const deleteOnly = defineAbilityFor({
      userId: 'u-file-delete',
      permissions: ['patient_file_delete'],
    });
    assert.equal(deleteOnly.can('delete', 'PatientFile'), true);
    assert.equal(deleteOnly.can('read', 'PatientFile'), true);
    assert.equal(deleteOnly.can('create', 'PatientFile'), false);
    assert.equal(deleteOnly.can('update', 'PatientFile'), false);
    assert.equal(deleteOnly.can('manage', 'PatientFile'), false);
  });

  it('PatientBudget fine actions do not imply manage or each other', () => {
    const readOnly = defineAbilityFor({
      userId: 'u-budget-read',
      permissions: ['patient_budget_read'],
    });
    assert.equal(readOnly.can('read', 'PatientBudget'), true);
    assert.equal(readOnly.can('update', 'PatientBudget'), false);
    assert.equal(readOnly.can('create', 'PatientBudget'), false);
    assert.equal(readOnly.can('delete', 'PatientBudget'), false);
    assert.equal(readOnly.can('approve', 'PatientBudget'), false);
    assert.equal(readOnly.can('manage', 'PatientBudget'), false);

    const updateOnly = defineAbilityFor({
      userId: 'u-budget-update',
      permissions: ['patient_budget_update'],
    });
    assert.equal(updateOnly.can('update', 'PatientBudget'), true);
    assert.equal(updateOnly.can('read', 'PatientBudget'), false);
    assert.equal(updateOnly.can('manage', 'PatientBudget'), false);

    const approveOnly = defineAbilityFor({
      userId: 'u-budget-approve',
      permissions: ['patient_budget_approve'],
    });
    assert.equal(approveOnly.can('approve', 'PatientBudget'), true);
    assert.equal(approveOnly.can('read', 'PatientBudget'), false);
    assert.equal(approveOnly.can('update', 'PatientBudget'), false);
    assert.equal(approveOnly.can('manage', 'PatientBudget'), false);
  });

  it('schedule_attend uses update without implying view_all or create_for_others', () => {
    const ability = defineAbilityFor({
      userId: 'u2c',
      permissions: ['schedule_attend'],
    });
    assert.equal(ability.can('update', 'Schedule'), true);
    assert.equal(ability.can('read', 'Schedule'), false);
    assert.equal(ability.can('create', 'Schedule'), false);
    assert.equal(ability.can('delete', 'Schedule'), false);
    assert.equal(ability.can('manage', 'Schedule'), false);
  });

  it('expands legacy settings_team alias', () => {
    const ability = defineAbilityFor({
      userId: 'u2b',
      permissions: ['settings_team'],
    });
    assert.equal(ability.can('create', 'Team'), true);
    assert.equal(ability.can('update', 'Team'), true);
    assert.equal(ability.can('delete', 'Team'), true);
    assert.equal(ability.can('read', 'Team'), true);
  });

  it('expands legacy patients_manage alias', () => {
    const ability = defineAbilityFor({
      userId: 'u3',
      permissions: ['not_a_real_permission', 'patients_manage'],
    });
    assert.equal(ability.can('read', 'Patient'), true);
    assert.equal(ability.can('create', 'Patient'), true);
    assert.equal(ability.can('access', 'Patient'), true);
    assert.equal(ability.can('manage', 'Team'), false);
  });

  it('grants Stock, Sales and Marketing campaign subjects', () => {
    const ability = defineAbilityFor({
      userId: 'u4',
      permissions: [
        'stock_access',
        'sales_access',
        'marketing_campaign_read',
      ],
    });
    assert.equal(ability.can('access', 'Stock'), true);
    assert.equal(ability.can('manage', 'Stock'), true);
    assert.equal(ability.can('access', 'Sales'), true);
    // sales_access NÃO concede manage (fora do manage-bridge).
    assert.equal(ability.can('manage', 'Sales'), false);
    assert.equal(ability.can('create', 'Sales'), false);
    assert.equal(ability.can('read', 'Marketing'), true);
    assert.equal(ability.can('create', 'Marketing'), false);
  });

  it('Dashboard fine permissions do not unlock each other via manage bridge', () => {
    const indicatorsOnly = defineAbilityFor({
      userId: 'u-dash-ind',
      permissions: ['dashboard_indicators'],
    });
    assert.equal(indicatorsOnly.can('read', 'Dashboard'), true);
    assert.equal(indicatorsOnly.can('update', 'Dashboard'), false);
    assert.equal(indicatorsOnly.can('access', 'Dashboard'), false);
    assert.equal(indicatorsOnly.can('manage', 'Dashboard'), false);

    const goalsOnly = defineAbilityFor({
      userId: 'u-dash-goals',
      permissions: ['dashboard_sales_goals'],
    });
    assert.equal(goalsOnly.can('update', 'Dashboard'), true);
    assert.equal(goalsOnly.can('read', 'Dashboard'), false);
    assert.equal(goalsOnly.can('access', 'Dashboard'), false);
    assert.equal(goalsOnly.can('manage', 'Dashboard'), false);

    const tasksOnly = defineAbilityFor({
      userId: 'u-dash-tasks',
      permissions: ['dashboard_tasks'],
    });
    assert.equal(tasksOnly.can('access', 'Dashboard'), true);
    assert.equal(tasksOnly.can('read', 'Dashboard'), false);
    assert.equal(tasksOnly.can('update', 'Dashboard'), false);
    assert.equal(tasksOnly.can('manage', 'Dashboard'), false);
  });

  it('sales_manage_opportunities grants manage without sales_access alone implying it', () => {
    const manageOnly = defineAbilityFor({
      userId: 'u-sales-manage',
      permissions: ['sales_manage_opportunities'],
    });
    assert.equal(manageOnly.can('manage', 'Sales'), true);
    assert.equal(manageOnly.can('create', 'Sales'), true);

    const accessOnly = defineAbilityFor({
      userId: 'u-sales-access',
      permissions: ['sales_access'],
    });
    assert.equal(accessOnly.can('access', 'Sales'), true);
    assert.equal(accessOnly.can('manage', 'Sales'), false);
  });

  it('sales_view_funnel_* map to distinct Sales actions (not generic read)', () => {
    const schedule = defineAbilityFor({
      userId: 'u-sched',
      permissions: ['sales_view_funnel_schedule'],
    });
    assert.equal(schedule.can('readScheduleFunnel', 'Sales'), true);
    assert.equal(schedule.can('readSalesFunnel', 'Sales'), false);
    assert.equal(schedule.can('read', 'Sales'), false);

    const sales = defineAbilityFor({
      userId: 'u-sales-funnel',
      permissions: ['sales_view_funnel_sales'],
    });
    assert.equal(sales.can('readSalesFunnel', 'Sales'), true);
    assert.equal(sales.can('readScheduleFunnel', 'Sales'), false);
  });

  it('expands legacy marketing_access alias', () => {
    const ability = defineAbilityFor({
      userId: 'u5',
      permissions: ['marketing_access'],
    });
    assert.equal(ability.can('create', 'Marketing'), true);
    assert.equal(ability.can('read', 'Marketing'), true);
    assert.equal(ability.can('update', 'Marketing'), true);
    assert.equal(ability.can('delete', 'Marketing'), true);
  });
});

describe('canUser', () => {
  it('delegates to defineAbilityFor', () => {
    assert.equal(
      canUser(
        { userId: 'u', permissions: ['financial_summary'] },
        'read',
        'Financial',
      ),
      true,
    );
  });
});

describe('validatePermissionIds', () => {
  it('splits valid and invalid; accepts legacy coarse ids', () => {
    const result = validatePermissionIds([
      'settings_team_create',
      'bogus',
      'patients_manage',
      'patient_create',
      'settings_team',
    ]);
    assert.deepEqual(result.valid, [
      'settings_team_create',
      'patients_manage',
      'patient_create',
      'settings_team',
    ]);
    assert.deepEqual(result.invalid, ['bogus']);
  });

  it('isValidPermissionId', () => {
    assert.equal(isValidPermissionId('vertical_access'), true);
    assert.equal(isValidPermissionId('patient_budget_read'), true);
    assert.equal(isValidPermissionId('store.clinic.settings.manage'), false);
  });
});

describe('expandPermissionIds', () => {
  it('expands schedule_manage into fine schedule ids', () => {
    const expanded = expandPermissionIds(['schedule_manage']);
    assert.ok(expanded.includes('schedule_view_menu'));
    assert.ok(expanded.includes('schedule_attend'));
    assert.ok(!expanded.includes('schedule_manage'));
  });

  it('settings_manage does not expand to stock_access', () => {
    const expanded = expandPermissionIds(['settings_manage']);
    assert.ok(expanded.includes('settings_manage'));
    assert.ok(!expanded.includes('stock_access'));
  });
});

describe('permissionsForRole', () => {
  it('maps dentista_admin to all store permission ids', () => {
    assert.deepEqual(
      permissionsForRole('dentista_admin').sort(),
      [...STORE_PERMISSION_IDS].sort(),
    );
  });

  it('maps dentista without patient_delete / evolution_delete', () => {
    const dentista = permissionsForRole('dentista');
    assert.ok(dentista.includes('schedule_attend'));
    assert.ok(dentista.includes('schedule_delete'));
    assert.ok(dentista.includes('patient_read_personal'));
    assert.ok(!dentista.includes('patient_delete'));
    assert.ok(!dentista.includes('patient_evolution_delete'));
    assert.ok(!dentista.includes('patients_manage'));
  });

  it('maps aluno, contador, radiologia and secretario presets', () => {
    assert.deepEqual(permissionsForRole('aluno').sort(), [
      'patient_anamnesis',
      'schedule_attend',
      'schedule_view_menu',
    ]);
    const contador = permissionsForRole('contador');
    assert.ok(contador.includes('dashboard_indicators'));
    assert.ok(contador.includes('financial_summary'));
    assert.ok(contador.includes('stock_access'));
    assert.deepEqual(permissionsForRole('radiologia'), ['patient_file_create']);
    const secretario = permissionsForRole('secretario');
    assert.ok(secretario.includes('dashboard_tasks'));
    assert.ok(!secretario.includes('schedule_attend'));
    assert.ok(!secretario.includes('sales_access'));
    assert.ok(secretario.includes('sales_manage_opportunities'));
    assert.ok(!secretario.includes('settings_team_create'));
  });

  it('maps gerente without agenda; vendedor with sales_access', () => {
    const gerente = permissionsForRole('gerente');
    assert.ok(!gerente.includes('schedule_view_menu'));
    assert.ok(gerente.includes('settings_manage'));
    assert.ok(!gerente.includes('patient_evolution_update'));
    assert.ok(!gerente.includes('patient_file_delete'));

    const vendedor = permissionsForRole('vendedor');
    assert.ok(vendedor.includes('sales_access'));
    assert.ok(!vendedor.includes('schedule_attend'));
    assert.ok(vendedor.includes('patient_anamnesis'));
  });

  it('returns empty for unknown role', () => {
    assert.deepEqual(permissionsForRole('operador'), []);
    assert.deepEqual(permissionsForRole('recepcionista'), []);
    assert.deepEqual(permissionsForRole('auxiliar'), []);
    assert.deepEqual(permissionsForRole('financeiro'), []);
  });
});

describe('settings granular subjects', () => {
  it('grants ClinicPlan independently of Settings', () => {
    const ability = defineAbilityFor({
      userId: 'u',
      permissions: ['settings_plans'],
    });
    assert.equal(ability.can('manage', 'ClinicPlan'), true);
    assert.equal(ability.can('manage', 'Settings'), false);
    assert.equal(ability.can('manage', 'AnamnesisTemplate'), false);
  });
});
