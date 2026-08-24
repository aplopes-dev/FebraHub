export type ReportGroupId =
  | 'patients'
  | 'appointments'
  | 'sales'
  | 'financial'
  | 'marketing';

export type ReportId =
  | 'birthdays'
  | 'open_treatments_without_appointment'
  | 'approved_budgets'
  | 'open_budgets'
  | 'rejected_budgets'
  | 'sales_by_specialty'
  | 'sales_by_plan'
  | 'sales_by_professional'
  | 'sales_by_treatment'
  | 'expenses_by_category'
  | 'excluded_revenues'
  | 'referred_patients';

export type ReportPeriodFilter =
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'last_30_days'
  | 'custom';

export type ReportBudgetPeriodMode = 'annual' | 'monthly';

export type ReportsHeaderFilterKind = 'none' | 'relative' | 'budget';

export type ReportCatalogItem = {
  id: ReportId;
  label: string;
};

export type ReportCatalogGroup = {
  id: ReportGroupId;
  label: string;
  items: readonly ReportCatalogItem[];
};

export type ReportBirthdayRow = {
  id: string;
  patientName: string;
  phone: string;
  birthDate: string;
  mobile: string;
};

export type ReportOpenTreatmentsWithoutAppointmentRow = {
  id: string;
  patientName: string;
  phone: string;
  mobile: string;
  document: string;
};

export type ReportBudgetRow = {
  id: string;
  budgetDate: string;
  patientName: string;
  document: string;
  mobile: string;
  email: string;
  responsibleMobile: string;
  description: string;
  status: string;
  valueCents: number;
};

export type ReportSalesBySpecialtyRow = {
  id: string;
  specialtyName: string;
  saleDate: string;
  patientName: string;
  treatmentName: string;
  valueCents: number;
};

export type ReportSalesByPlanRow = {
  id: string;
  planName: string;
  saleDate: string;
  patientName: string;
  treatmentName: string;
  valueCents: number;
};

export type ReportSalesByProfessionalRow = {
  id: string;
  professionalName: string;
  saleDate: string;
  patientName: string;
  treatmentName: string;
  valueCents: number;
};

export type ReportSalesByTreatmentRow = {
  id: string;
  treatmentName: string;
  saleDate: string;
  patientName: string;
  planName: string;
  valueCents: number;
};

export type ReportExpensesByCategoryRow = {
  id: string;
  categoryName: string;
  valueCents: number;
  /** Percentual 0–100 (ex.: 61.4 → 61,4%). */
  percentage: number;
};

export type ReportExcludedRevenueRow = {
  id: string;
  patientName: string;
  description: string;
  valueCents: number;
  excludedAt: string;
  excludedBy: string;
};

export type ReportReferredPatientRow = {
  id: string;
  referredPatientName: string;
  referredBy: string;
  referralDate: string;
  firstAppointmentDate: string | null;
  approvedBudgetsCount: number;
};
