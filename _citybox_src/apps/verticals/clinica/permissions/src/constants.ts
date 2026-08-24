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
 * Catálogo estático — fonte única de verdade.
 * UI de equipe: `STORE_PERMISSIONS_MODULES` (sem `vertical` nem aliases grossos).
 * Aliases legados (`patients_manage`, …) vivem em `PERMISSION_ALIASES` + validação.
 */
export const PERMISSIONS_MODULES: PermissionModule[] = [
  {
    id: 'vertical',
    name: 'Acesso à vertical',
    permissions: [
      p(
        'vertical_access',
        'Acessar a vertical Clínica',
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
        'Fazer atendimentos',
        'update',
        'Schedule',
        'schedule',
      ),
      p(
        'schedule_view_all',
        'Ver consultas de todos os profissionais',
        'read',
        'Schedule',
        'schedule',
      ),
      p(
        'schedule_create_for_others',
        'Criar compromissos para outros profissionais',
        'create',
        'Schedule',
        'schedule',
      ),
      p(
        'schedule_delete',
        'Excluir consultas',
        'delete',
        'Schedule',
        'schedule',
      ),
    ],
  },
  {
    id: 'settings',
    name: 'Configurações Gerais',
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
        'Configurações da clínica',
        'manage',
        'Settings',
        'settings',
      ),
      p(
        'settings_plans',
        'Cadastro de planos',
        'manage',
        'ClinicPlan',
        'settings',
      ),
      p(
        'settings_anamnesis',
        'Configuração de anamneses',
        'manage',
        'AnamnesisTemplate',
        'settings',
      ),
      p(
        'settings_contracts',
        'Gerenciamento de modelos de contrato',
        'manage',
        'ContractModel',
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
        'Editar categorias',
        'update',
        'Category',
        'settings',
      ),
    ],
  },
  {
    id: 'stock',
    name: 'Estoque',
    permissions: [
      p('stock_access', 'Estoque', 'access', 'Stock', 'stock'),
    ],
  },
  {
    id: 'patients',
    name: 'Ficha do Paciente',
    permissions: [
      p(
        'patient_create',
        'Cadastrar paciente',
        'create',
        'Patient',
        'patients',
      ),
      p(
        'patient_delete',
        'Inativar paciente',
        'delete',
        'Patient',
        'patients',
      ),
      p(
        'patient_read_personal',
        'Visualizar dados pessoais',
        'read',
        'Patient',
        'patients',
      ),
      p(
        'patient_update_personal',
        'Editar dados pessoais',
        'update',
        'Patient',
        'patients',
      ),
      p(
        'patient_budget_create',
        'Cadastrar orçamentos',
        'create',
        'PatientBudget',
        'patients',
      ),
      p(
        'patient_budget_read',
        'Visualizar orçamentos',
        'read',
        'PatientBudget',
        'patients',
      ),
      p(
        'patient_budget_update',
        'Editar orçamentos',
        'update',
        'PatientBudget',
        'patients',
      ),
      p(
        'patient_budget_approve',
        'Aprovar orçamentos',
        'approve',
        'PatientBudget',
        'patients',
      ),
      p(
        'patient_budget_delete',
        'Excluir orçamentos',
        'delete',
        'PatientBudget',
        'patients',
      ),
      p(
        'patient_treatments',
        'Visualizar prontuário',
        'manage',
        'PatientTreatment',
        'patients',
      ),
      p(
        'patient_evolution_create',
        'Emitir evoluções',
        'create',
        'PatientEvolution',
        'patients',
      ),
      p(
        'patient_evolution_update',
        'Editar evoluções',
        'update',
        'PatientEvolution',
        'patients',
      ),
      p(
        'patient_evolution_delete',
        'Excluir evoluções',
        'delete',
        'PatientEvolution',
        'patients',
      ),
      p(
        'patient_file_create',
        'Inserir arquivos, imagens e pastas',
        'create',
        'PatientFile',
        'patients',
      ),
      p(
        'patient_file_manage',
        'Visualizar e editar arquivos, imagens e pastas',
        'update',
        'PatientFile',
        'patients',
      ),
      p(
        'patient_file_delete',
        'Excluir arquivos, imagens e pastas',
        'delete',
        'PatientFile',
        'patients',
      ),
      p(
        'patient_debit',
        'Débitos',
        'manage',
        'Patient',
        'patients',
      ),
      p(
        'patient_prescription_create',
        'Criar receituário',
        'create',
        'PatientPrescription',
        'patients',
      ),
      p(
        'patient_certificate_create',
        'Criar atestados',
        'create',
        'PatientCertificate',
        'patients',
      ),
      p(
        'patient_anamnesis',
        'Anamnese odontológica',
        'manage',
        'PatientAnamnesis',
        'patients',
      ),
    ],
  },
  {
    id: 'financial',
    name: 'Financeiro',
    permissions: [
      p(
        'financial_summary',
        'Visualizar resumo financeiro',
        'read',
        'Financial',
        'financial',
      ),
      p(
        'financial_income_view',
        'Visualizar receitas/débitos',
        'read',
        'FinancialIncome',
        'financial',
      ),
      p(
        'financial_income_create',
        'Cadastrar receitas/débitos',
        'create',
        'FinancialIncome',
        'financial',
      ),
      p(
        'financial_income_update',
        'Editar receitas/débitos',
        'update',
        'FinancialIncome',
        'financial',
      ),
      p(
        'financial_income_delete',
        'Excluir receitas/débitos',
        'delete',
        'FinancialIncome',
        'financial',
      ),
      p(
        'financial_expense_view',
        'Visualizar despesas',
        'read',
        'FinancialExpense',
        'financial',
      ),
      p(
        'financial_expense_create',
        'Cadastrar despesas',
        'create',
        'FinancialExpense',
        'financial',
      ),
      p(
        'financial_expense_update',
        'Editar despesas',
        'update',
        'FinancialExpense',
        'financial',
      ),
      p(
        'financial_expense_delete',
        'Excluir despesas',
        'delete',
        'FinancialExpense',
        'financial',
      ),
      p(
        'financial_pay_receive',
        'Pagar despesas e receber receitas/débitos',
        'settle',
        'FinancialIncome',
        'financial',
      ),
      p(
        'financial_receive_future',
        'Receber receitas/débitos com data futura',
        'settleFuture',
        'FinancialIncome',
        'financial',
      ),
      p(
        'financial_receive_retroactive',
        'Receber receitas/débitos com data retroativa',
        'settleRetroactive',
        'FinancialIncome',
        'financial',
      ),
      p(
        'financial_commission_own',
        'Visualizar a própria comissão',
        'read',
        'FinancialCommission',
        'financial',
      ),
      p(
        'financial_commission_all',
        'Visualizar todas as comissões',
        'update',
        'FinancialCommission',
        'financial',
      ),
      p(
        'financial_commission_pay',
        'Pagar comissão',
        'settle',
        'FinancialCommission',
        'financial',
      ),
      p(
        'financial_account_create',
        'Cadastrar contas financeiras',
        'create',
        'FinancialAccount',
        'financial',
      ),
      p(
        'financial_account_delete',
        'Excluir contas financeiras',
        'delete',
        'FinancialAccount',
        'financial',
      ),
      p(
        'financial_category_create',
        'Cadastrar categorias',
        'create',
        'FinancialCategory',
        'financial',
      ),
      p(
        'financial_category_delete',
        'Excluir categorias',
        'delete',
        'FinancialCategory',
        'financial',
      ),
    ],
  },
  {
    id: 'sales',
    name: 'Vendas',
    permissions: [
      p('sales_access', 'Acesso a funcionalidade Vendas', 'access', 'Sales', 'sales'),
      p(
        'sales_manage_opportunities',
        'Criar, editar, excluir e mover oportunidades e etapas (qualquer funil)',
        'manage',
        'Sales',
        'sales',
      ),
      p(
        'sales_view_funnel_schedule',
        'Visualizar funil de agendamento',
        'readScheduleFunnel',
        'Sales',
        'sales',
      ),
      p(
        'sales_view_funnel_sales',
        'Visualizar funil de vendas',
        'readSalesFunnel',
        'Sales',
        'sales',
      ),
      p(
        'sales_view_funnel_custom',
        'Visualizar funil personalizado',
        'readCustomFunnel',
        'Sales',
        'sales',
      ),
      p(
        'sales_view_clinic_funnels',
        'Visualizar funis criados pela clínica',
        'readClinicFunnels',
        'Sales',
        'sales',
      ),
    ],
  },
  {
    id: 'marketing',
    name: 'Marketing',
    permissions: [
      p(
        'marketing_campaign_create',
        'Criar campanha',
        'create',
        'Marketing',
        'marketing',
      ),
      p(
        'marketing_campaign_read',
        'Ver campanha',
        'read',
        'Marketing',
        'marketing',
      ),
      p(
        'marketing_campaign_update',
        'Editar campanha',
        'update',
        'Marketing',
        'marketing',
      ),
      p(
        'marketing_campaign_finalize',
        'Finalizar campanha',
        'delete',
        'Marketing',
        'marketing',
      ),
    ],
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    permissions: [
      p(
        'dashboard_sales_goals',
        'Definir e editar metas de vendas',
        'update',
        'Dashboard',
        'dashboard',
      ),
      p(
        'dashboard_indicators',
        'Ver indicadores e relatórios',
        'read',
        'Dashboard',
        'dashboard',
      ),
      p(
        'dashboard_tasks',
        'Ver tarefas',
        'access',
        'Dashboard',
        'dashboard',
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

/**
 * IDs grossos legados → expansão para IDs finos (compatibilidade de JSON antigo).
 * Não aparecem na UI; só no mapper / validação.
 */
export const PERMISSION_ALIASES: Record<string, readonly string[]> = {
  patients_manage: STORE_PERMISSIONS.filter((x) => x.moduleId === 'patients').map(
    (x) => x.id,
  ),
  schedule_manage: STORE_PERMISSIONS.filter((x) => x.moduleId === 'schedule').map(
    (x) => x.id,
  ),
  financial_manage: STORE_PERMISSIONS.filter(
    (x) => x.moduleId === 'financial',
  ).map((x) => x.id),
  /** Alias legado do checkbox único de equipe. */
  settings_team: [
    'settings_team_create',
    'settings_team_update',
    'settings_team_inactivate',
  ],
  /** Alias legado do checkbox único de categorias. */
  settings_categories: [
    'settings_categories_create',
    'settings_categories_update',
  ],
  /** Alias legado do checkbox único Documentos na ficha. */
  patient_documents: [
    'patient_prescription_create',
    'patient_certificate_create',
  ],
  /** Alias legado do acesso único a Marketing. */
  marketing_access: [
    'marketing_campaign_create',
    'marketing_campaign_read',
    'marketing_campaign_update',
    'marketing_campaign_finalize',
  ],
  /** Alias curto caso algum vínculo tenha gravado o ID antigo. */
  marketing_campaign_delete: ['marketing_campaign_finalize'],
};

export const LEGACY_COARSE_PERMISSION_IDS = [
  'patients_manage',
  'schedule_manage',
  'financial_manage',
  'settings_team',
  'settings_categories',
  'patient_documents',
  'marketing_access',
  'marketing_campaign_delete',
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

/** IDs canônicos (finos + gate SSO). */
export const CLINIC_PERMISSION_IDS = {
  verticalAccess: 'vertical_access',
  scheduleViewMenu: 'schedule_view_menu',
  scheduleAttend: 'schedule_attend',
  scheduleViewAll: 'schedule_view_all',
  scheduleCreateForOthers: 'schedule_create_for_others',
  scheduleDelete: 'schedule_delete',
  settingsTeamCreate: 'settings_team_create',
  settingsTeamUpdate: 'settings_team_update',
  settingsTeamInactivate: 'settings_team_inactivate',
  settingsManage: 'settings_manage',
  settingsPlans: 'settings_plans',
  settingsAnamnesis: 'settings_anamnesis',
  settingsContracts: 'settings_contracts',
  settingsCategoriesCreate: 'settings_categories_create',
  settingsCategoriesUpdate: 'settings_categories_update',
  stockAccess: 'stock_access',
  patientCreate: 'patient_create',
  patientDelete: 'patient_delete',
  patientReadPersonal: 'patient_read_personal',
  patientUpdatePersonal: 'patient_update_personal',
  patientBudgetCreate: 'patient_budget_create',
  patientBudgetRead: 'patient_budget_read',
  patientBudgetUpdate: 'patient_budget_update',
  patientBudgetApprove: 'patient_budget_approve',
  patientBudgetDelete: 'patient_budget_delete',
  patientTreatments: 'patient_treatments',
  patientEvolutionCreate: 'patient_evolution_create',
  patientEvolutionUpdate: 'patient_evolution_update',
  patientEvolutionDelete: 'patient_evolution_delete',
  patientFileCreate: 'patient_file_create',
  patientFileManage: 'patient_file_manage',
  patientFileDelete: 'patient_file_delete',
  patientDebit: 'patient_debit',
  patientPrescriptionCreate: 'patient_prescription_create',
  patientCertificateCreate: 'patient_certificate_create',
  patientAnamnesis: 'patient_anamnesis',
  financialSummary: 'financial_summary',
  financialIncomeView: 'financial_income_view',
  financialIncomeCreate: 'financial_income_create',
  financialIncomeUpdate: 'financial_income_update',
  financialIncomeDelete: 'financial_income_delete',
  financialExpenseView: 'financial_expense_view',
  financialExpenseCreate: 'financial_expense_create',
  financialExpenseUpdate: 'financial_expense_update',
  financialExpenseDelete: 'financial_expense_delete',
  financialPayReceive: 'financial_pay_receive',
  financialReceiveFuture: 'financial_receive_future',
  financialReceiveRetroactive: 'financial_receive_retroactive',
  financialCommissionOwn: 'financial_commission_own',
  financialCommissionAll: 'financial_commission_all',
  financialCommissionPay: 'financial_commission_pay',
  financialAccountCreate: 'financial_account_create',
  financialAccountDelete: 'financial_account_delete',
  financialCategoryCreate: 'financial_category_create',
  financialCategoryDelete: 'financial_category_delete',
  salesAccess: 'sales_access',
  salesManageOpportunities: 'sales_manage_opportunities',
  salesViewFunnelSchedule: 'sales_view_funnel_schedule',
  salesViewFunnelSales: 'sales_view_funnel_sales',
  salesViewFunnelCustom: 'sales_view_funnel_custom',
  salesViewClinicFunnels: 'sales_view_clinic_funnels',
  marketingCampaignCreate: 'marketing_campaign_create',
  marketingCampaignRead: 'marketing_campaign_read',
  marketingCampaignUpdate: 'marketing_campaign_update',
  marketingCampaignFinalize: 'marketing_campaign_finalize',
  dashboardSalesGoals: 'dashboard_sales_goals',
  dashboardIndicators: 'dashboard_indicators',
  dashboardTasks: 'dashboard_tasks',
  /** Aliases legados (compat). */
  settingsTeam: 'settings_team',
  settingsCategories: 'settings_categories',
  patientDocuments: 'patient_documents',
  patientsManage: 'patients_manage',
  scheduleManage: 'schedule_manage',
  financialManage: 'financial_manage',
  marketingAccess: 'marketing_access',
  marketingCampaignDelete: 'marketing_campaign_delete',
} as const;
