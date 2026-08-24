'use client';

import { CLINIC_PERMISSION_IDS } from '@citybox/clinica-permissions';
import { useCan } from '@/features/clinic/permissions';
import { useStore } from '@/lib/store-context';
import { resolveAllowedEntryTypes } from '../lib/resolve-allowed-entry-types';

/**
 * Gates CASL do módulo Financeiro (caixa / transações / comissões).
 *
 * - Views (`financial_*_view`) abrem o módulo e as listagens.
 * - `financial_summary` é plus: só libera cards de KPI se já houver view.
 * - Só summary → Financeiro fechado (sidebar e rotas).
 * - Configurações: **somente** os 4 checkboxes de contas/categorias
 *   (IDs no JSON da Equipe — não usa bypass `manage all` do OWNER).
 */
export function useFinancialPermissions() {
  const { storeId, accessibleStores } = useStore();
  const clinicPermissions =
    accessibleStores.find((store) => store.id === storeId)?.permissions ?? [];

  const canSummary = useCan('read', 'Financial');
  const canViewIncome = useCan('read', 'FinancialIncome');
  const canCreateIncome = useCan('create', 'FinancialIncome');
  const canUpdateIncome = useCan('update', 'FinancialIncome');
  const canDeleteIncome = useCan('delete', 'FinancialIncome');
  const canViewExpense = useCan('read', 'FinancialExpense');
  const canCreateExpense = useCan('create', 'FinancialExpense');
  const canUpdateExpense = useCan('update', 'FinancialExpense');
  const canDeleteExpense = useCan('delete', 'FinancialExpense');
  const canSettleIncome = useCan('settle', 'FinancialIncome');
  const canSettleExpense = useCan('settle', 'FinancialExpense');
  const canSettleFuture = useCan('settleFuture', 'FinancialIncome');
  const canSettleRetroactive = useCan('settleRetroactive', 'FinancialIncome');
  const canCommissionOwn = useCan('read', 'FinancialCommission');
  /** `update` = ver todas (não usar `manage` — no CASL manage implica create/settle). */
  const canCommissionAll = useCan('update', 'FinancialCommission');
  const canCommissionPay = useCan('settle', 'FinancialCommission');

  // Contas/categorias: checkboxes da Equipe (não ability.manage all do OWNER).
  const canCreateAccount = clinicPermissions.includes(
    CLINIC_PERMISSION_IDS.financialAccountCreate,
  );
  const canDeleteAccount = clinicPermissions.includes(
    CLINIC_PERMISSION_IDS.financialAccountDelete,
  );
  const canCreateCategory = clinicPermissions.includes(
    CLINIC_PERMISSION_IDS.financialCategoryCreate,
  );
  const canDeleteCategory = clinicPermissions.includes(
    CLINIC_PERMISSION_IDS.financialCategoryDelete,
  );

  const canAccessCashFlow = canViewIncome || canViewExpense;
  /** Transações exige as duas views (resumo não abre a aba sozinho). */
  const canAccessTransactions = canViewIncome && canViewExpense;
  const canAccessCommissions = canCommissionOwn || canCommissionAll;
  const canAccessAccountSettings = canCreateAccount || canDeleteAccount;
  const canAccessCategorySettings = canCreateCategory || canDeleteCategory;
  const canAccessSettings = canAccessAccountSettings || canAccessCategorySettings;

  const allowedEntryTypes = resolveAllowedEntryTypes({
    canViewIncome,
    canViewExpense,
  });

  /** Cards só com summary + pelo menos uma view (já implícito ao estar na página). */
  const showStatsCards = canSummary && canAccessCashFlow;

  return {
    canSummary,
    canViewIncome,
    canCreateIncome,
    canUpdateIncome,
    canDeleteIncome,
    canViewExpense,
    canCreateExpense,
    canUpdateExpense,
    canDeleteExpense,
    canSettleIncome,
    canSettleExpense,
    canPayReceive: canSettleIncome || canSettleExpense,
    canSettleFuture,
    canSettleRetroactive,
    canCommissionOwn,
    canCommissionAll,
    canCommissionPay,
    canCreateAccount,
    canDeleteAccount,
    canCreateCategory,
    canDeleteCategory,
    canAccessCashFlow,
    canAccessTransactions,
    canAccessCommissions,
    canAccessSettings,
    canAccessAccountSettings,
    canAccessCategorySettings,
    allowedEntryTypes,
    showStatsCards,
    showIncomeStats: showStatsCards,
    showExpenseStats: showStatsCards,
    showBalanceStats: showStatsCards,
  };
}
