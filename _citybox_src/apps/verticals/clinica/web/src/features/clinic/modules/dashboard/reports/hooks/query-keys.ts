import type { ReportApprovedBudgetsListParams } from '../services/reports-approved-budgets.service';
import type { ReportBirthdaysListParams } from '../services/reports-birthdays.service';
import type { ReportOpenBudgetsListParams } from '../services/reports-open-budgets.service';
import type { ReportOpenTreatmentsListParams } from '../services/reports-open-treatments.service';
import type { ReportRejectedBudgetsListParams } from '../services/reports-rejected-budgets.service';
import type { ReportSalesByPlanListParams } from '../services/reports-sales-by-plan.service';
import type { ReportSalesByProfessionalListParams } from '../services/reports-sales-by-professional.service';
import type { ReportSalesBySpecialtyListParams } from '../services/reports-sales-by-specialty.service';
import type { ReportSalesByTreatmentListParams } from '../services/reports-sales-by-treatment.service';
import type { ReportExpensesByCategoryListParams } from '../services/reports-expenses-by-category.service';
import type { ReportExcludedRevenuesListParams } from '../services/reports-excluded-revenues.service';
import type { ReportReferredPatientsListParams } from '../services/reports-referred-patients.service';

export const reportKeys = {
  all: (storeId: string) => ['clinic', 'reports', storeId] as const,
  birthdays: (storeId: string, params: ReportBirthdaysListParams) =>
    [...reportKeys.all(storeId), 'birthdays', params] as const,
  openTreatmentsWithoutAppointment: (
    storeId: string,
    params: ReportOpenTreatmentsListParams,
  ) =>
    [
      ...reportKeys.all(storeId),
      'open-treatments-without-appointment',
      params,
    ] as const,
  approvedBudgets: (
    storeId: string,
    params: ReportApprovedBudgetsListParams,
  ) => [...reportKeys.all(storeId), 'approved-budgets', params] as const,
  openBudgets: (storeId: string, params: ReportOpenBudgetsListParams) =>
    [...reportKeys.all(storeId), 'open-budgets', params] as const,
  rejectedBudgets: (
    storeId: string,
    params: ReportRejectedBudgetsListParams,
  ) => [...reportKeys.all(storeId), 'rejected-budgets', params] as const,
  salesBySpecialty: (
    storeId: string,
    params: ReportSalesBySpecialtyListParams,
  ) => [...reportKeys.all(storeId), 'sales-by-specialty', params] as const,
  salesByPlan: (storeId: string, params: ReportSalesByPlanListParams) =>
    [...reportKeys.all(storeId), 'sales-by-plan', params] as const,
  salesByProfessional: (
    storeId: string,
    params: ReportSalesByProfessionalListParams,
  ) => [...reportKeys.all(storeId), 'sales-by-professional', params] as const,
  salesByTreatment: (
    storeId: string,
    params: ReportSalesByTreatmentListParams,
  ) => [...reportKeys.all(storeId), 'sales-by-treatment', params] as const,
  expensesByCategory: (
    storeId: string,
    params: ReportExpensesByCategoryListParams,
  ) => [...reportKeys.all(storeId), 'expenses-by-category', params] as const,
  excludedRevenues: (
    storeId: string,
    params: ReportExcludedRevenuesListParams,
  ) => [...reportKeys.all(storeId), 'excluded-revenues', params] as const,
  referredPatients: (
    storeId: string,
    params: ReportReferredPatientsListParams,
  ) => [...reportKeys.all(storeId), 'referred-patients', params] as const,
};
