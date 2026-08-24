import { clinicaFetch } from '@/features/clinic/shared/api';
import { toPatientPhotoUrl } from '@/features/clinic/modules/patients/lib/patient-api-mappers';
import type {
  BirthdayListItem,
  BirthdayPeriodFilter,
  BudgetAnalysisAggregate,
  BudgetAnalysisDimension,
  BudgetPeriodMode,
  DashboardAcquisitionPatient,
  DashboardAcquisitionPeriodMode,
  DashboardBudgetAnalysisRow,
  DashboardBudgetAnalysisStatus,
  DashboardBudgetAnalysisStatusResult,
  DashboardBudgetRow,
  DashboardFinancialSummary,
  DashboardPatientMetricItem,
  DashboardPatientAcquisitionResult,
  DashboardPatientDemographicsResult,
  DashboardPatientsListMetricId,
  DashboardPatientsSummary,
  DashboardReferralSourceKey,
  DashboardGenderFilter,
  DashboardSalesGoalsSummary,
  DashboardAppointmentsResult,
  DashboardAppointmentDetailRow,
  DashboardAppointmentGroup,
  ConsultasPeriodMode,
  CashflowPeriodMode,
  CommissionsPeriodMode,
  DashboardCashflowResult,
  DashboardCommissionsResult,
  DashboardCommissionPaidRow,
  DashboardCommissionsDetailsMeta,
  DashboardPaymentMethodsResult,
  DashboardTicketMedioResult,
  DashboardInadimplenciaResult,
  DashboardInadimplenciaDebtRow,
  DashboardInadimplenciaDetailsMeta,
  DashboardExpenseByCategoryResult,
  DashboardSummary,
  RevenueAggregateRow,
  RevenueAnalysisDimension,
  RevenueAnalysisMode,
  RevenueDetailRow,
  RevenuePeriodFilter,
  TicketMedioPeriodMode,
  InadimplenciaPeriodMode,
  ExpenseByCategoryPeriodMode,
} from '../types/clinic-dashboard';
import { resolveFinancialMonthDateRange } from '../lib/dashboard-financial';

export type { DashboardSummary };

export type DashboardFinancialSummaryParams = {
  year: number;
  month: number;
};

type FinancialStatsApiResponse = {
  income: { received: number; toReceive: number; total: number };
  expense: { paid: number; toPay: number; total: number };
  balance: { current: number; projected: number };
};

function mapFinancialStatsToSummary(
  data: FinancialStatsApiResponse,
): DashboardFinancialSummary {
  return {
    income: {
      receivedCents: data.income.received,
      toReceiveCents: data.income.toReceive,
      totalCents: data.income.total,
    },
    expense: {
      paidCents: data.expense.paid,
      toPayCents: data.expense.toPay,
      totalCents: data.expense.total,
    },
    balance: {
      currentCents: data.balance.current,
      projectedCents: data.balance.projected,
    },
  };
}

export type DashboardBirthdaysListParams = {
  period?: BirthdayPeriodFilter;
  startDate?: string;
  endDate?: string;
  page?: number;
  perPage?: number;
  search?: string;
};

export type DashboardBirthdaysListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type DashboardBirthdaysListResult = {
  items: BirthdayListItem[];
  meta: DashboardBirthdaysListMeta;
};

type DashboardBirthdayApiItem = {
  id: string;
  name: string;
  phone: string;
  birthDate: string;
  photoUrl: string | null;
  ageYears: number;
  daysUntil: number;
  relativeLabel: string;
};

export async function fetchDashboardSummary(
  storeId: string,
): Promise<DashboardSummary> {
  const res = await clinicaFetch<{ data: DashboardSummary }>(
    storeId,
    '/v1/dashboard/summary',
  );
  return {
    overdueIncomeTotalCents: res.data.overdueIncomeTotalCents,
    openRejectedBudgetsTotalCents: res.data.openRejectedBudgetsTotalCents,
    upcomingBirthdaysCount: res.data.upcomingBirthdaysCount,
  };
}

export async function fetchDashboardFinancialSummary(
  storeId: string,
  params: DashboardFinancialSummaryParams,
): Promise<DashboardFinancialSummary> {
  const { startDate, endDate } = resolveFinancialMonthDateRange(
    params.year,
    params.month,
  );
  const searchParams = new URLSearchParams({ startDate, endDate });
  const res = await clinicaFetch<{ data: FinancialStatsApiResponse }>(
    storeId,
    `/v1/financial/entries/stats?${searchParams.toString()}`,
  );
  return mapFinancialStatsToSummary(res.data);
}

export async function fetchDashboardBirthdays(
  storeId: string,
  params: DashboardBirthdaysListParams = {},
): Promise<DashboardBirthdaysListResult> {
  const searchParams = new URLSearchParams();
  if (params.period) searchParams.set('period', params.period);
  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.endDate) searchParams.set('endDate', params.endDate);
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.perPage !== undefined) {
    searchParams.set('perPage', String(params.perPage));
  }
  if (params.search?.trim()) searchParams.set('search', params.search.trim());

  const query = searchParams.toString();
  const path = query
    ? `/v1/dashboard/birthdays?${query}`
    : '/v1/dashboard/birthdays';

  const res = await clinicaFetch<{
    data: DashboardBirthdayApiItem[];
    meta: DashboardBirthdaysListMeta;
  }>(storeId, path);

  return {
    items: res.data.map((item) => ({
      id: item.id,
      name: item.name,
      phone: item.phone,
      birthDate: item.birthDate,
      photoUrl: toPatientPhotoUrl(storeId, item.photoUrl),
      status: 'active' as const,
      ageYears: item.ageYears,
      daysUntil: item.daysUntil,
      relativeLabel: item.relativeLabel,
    })),
    meta: res.meta,
  };
}

export type DashboardBudgetsListParams = {
  page?: number;
  perPage?: number;
};

export type DashboardBudgetsListMeta = {
  total: number;
  totalValueCents: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type DashboardBudgetsListResult = {
  items: DashboardBudgetRow[];
  meta: DashboardBudgetsListMeta;
};

export async function fetchDashboardBudgets(
  storeId: string,
  params: DashboardBudgetsListParams = {},
): Promise<DashboardBudgetsListResult> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.perPage !== undefined) {
    searchParams.set('perPage', String(params.perPage));
  }

  const query = searchParams.toString();
  const path = query
    ? `/v1/dashboard/budgets?${query}`
    : '/v1/dashboard/budgets';

  const res = await clinicaFetch<{
    data: DashboardBudgetRow[];
    meta: DashboardBudgetsListMeta;
  }>(storeId, path);

  return { items: res.data, meta: res.meta };
}

export type DashboardRevenueAnalysisParams = {
  mode?: RevenueAnalysisMode;
  dimension?: RevenueAnalysisDimension;
  period?: RevenuePeriodFilter;
  startDate?: string;
  endDate?: string;
  includeWithoutRevenue?: boolean;
};

export type DashboardRevenueDetailsParams = DashboardRevenueAnalysisParams & {
  dimensionKey: string;
  page?: number;
  perPage?: number;
  search?: string;
};

export type DashboardRevenueDetailsMeta = {
  total: number;
  totalValueCents: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type DashboardRevenueDetailsResult = {
  items: RevenueDetailRow[];
  meta: DashboardRevenueDetailsMeta;
};

export async function fetchDashboardRevenueAnalysis(
  storeId: string,
  params: DashboardRevenueAnalysisParams = {},
): Promise<RevenueAggregateRow[]> {
  const searchParams = new URLSearchParams();
  if (params.mode) searchParams.set('mode', params.mode);
  if (params.dimension) searchParams.set('dimension', params.dimension);
  if (params.period) searchParams.set('period', params.period);
  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.endDate) searchParams.set('endDate', params.endDate);
  if (params.includeWithoutRevenue) {
    searchParams.set('includeWithoutRevenue', 'true');
  }

  const query = searchParams.toString();
  const path = query
    ? `/v1/dashboard/revenue-analysis?${query}`
    : '/v1/dashboard/revenue-analysis';

  const res = await clinicaFetch<{ data: RevenueAggregateRow[] }>(
    storeId,
    path,
  );
  return res.data;
}

export async function fetchDashboardRevenueDetails(
  storeId: string,
  params: DashboardRevenueDetailsParams,
): Promise<DashboardRevenueDetailsResult> {
  const searchParams = new URLSearchParams();
  searchParams.set('dimensionKey', params.dimensionKey);
  if (params.mode) searchParams.set('mode', params.mode);
  if (params.dimension) searchParams.set('dimension', params.dimension);
  if (params.period) searchParams.set('period', params.period);
  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.endDate) searchParams.set('endDate', params.endDate);
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.perPage !== undefined) {
    searchParams.set('perPage', String(params.perPage));
  }
  if (params.search?.trim()) searchParams.set('search', params.search.trim());

  const path = `/v1/dashboard/revenue-analysis/details?${searchParams.toString()}`;

  const res = await clinicaFetch<{
    data: RevenueDetailRow[];
    meta: DashboardRevenueDetailsMeta;
  }>(storeId, path);

  return { items: res.data, meta: res.meta };
}

export type DashboardPatientsListParams = {
  metric: DashboardPatientsListMetricId;
  page?: number;
  perPage?: number;
  search?: string;
};

export type DashboardPatientsListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type DashboardPatientsListResult = {
  items: DashboardPatientMetricItem[];
  meta: DashboardPatientsListMeta;
};

type DashboardPatientApiItem = {
  id: string;
  name: string;
  phone: string;
  landlinePhone?: string;
  email: string;
  cpf: string | null;
  valueCents?: number;
};

export async function fetchDashboardPatientsSummary(
  storeId: string,
): Promise<DashboardPatientsSummary> {
  const res = await clinicaFetch<{ data: DashboardPatientsSummary }>(
    storeId,
    '/v1/dashboard/patients/summary',
  );
  return res.data;
}

export async function fetchDashboardPatientsByMetric(
  storeId: string,
  params: DashboardPatientsListParams,
): Promise<DashboardPatientsListResult> {
  const searchParams = new URLSearchParams();
  searchParams.set('metric', params.metric);
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.perPage !== undefined) {
    searchParams.set('perPage', String(params.perPage));
  }
  if (params.search?.trim()) searchParams.set('search', params.search.trim());

  const path = `/v1/dashboard/patients?${searchParams.toString()}`;

  const res = await clinicaFetch<{
    data: DashboardPatientApiItem[];
    meta: DashboardPatientsListMeta;
  }>(storeId, path);

  return {
    items: res.data.map((item) => ({
      id: item.id,
      name: item.name,
      phone: item.phone,
      landlinePhone: item.landlinePhone || undefined,
      email: item.email || undefined,
      cpf: item.cpf ?? undefined,
      ...(item.valueCents !== undefined ? { valueCents: item.valueCents } : {}),
    })),
    meta: res.meta,
  };
}

export type UpsertDashboardSalesGoalParams = {
  goalCents: number;
};

export async function fetchDashboardSalesGoals(
  storeId: string,
): Promise<DashboardSalesGoalsSummary> {
  const res = await clinicaFetch<{ data: DashboardSalesGoalsSummary }>(
    storeId,
    '/v1/dashboard/sales-goals',
  );
  return res.data;
}

/** Cria ou substitui a meta ativa; substituir reinicia o acúmulo. */
export async function upsertDashboardSalesGoal(
  storeId: string,
  params: UpsertDashboardSalesGoalParams,
): Promise<{ goalCents: number; startDate: string }> {
  const res = await clinicaFetch<{
    data: { goalCents: number; startDate: string };
  }>(storeId, '/v1/dashboard/sales-goals', {
    method: 'PUT',
    body: JSON.stringify(params),
  });
  return res.data;
}

export type DashboardBudgetAnalysisPeriodParams = {
  periodMode: BudgetPeriodMode;
  year: number;
  month?: number;
  professionalId?: string;
};

export type DashboardBudgetAnalysisStatusParams =
  DashboardBudgetAnalysisPeriodParams;

export type DashboardBudgetAnalysisParams =
  DashboardBudgetAnalysisPeriodParams & {
    status: DashboardBudgetAnalysisStatus;
    dimension: BudgetAnalysisDimension;
  };

export type DashboardBudgetAnalysisDetailsParams =
  DashboardBudgetAnalysisPeriodParams & {
    status: DashboardBudgetAnalysisStatus;
    dimension?: BudgetAnalysisDimension;
    dimensionKey?: string;
    page?: number;
    perPage?: number;
    search?: string;
  };

export type DashboardBudgetAnalysisDetailsMeta = {
  total: number;
  totalValueCents: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type DashboardBudgetAnalysisDetailsResult = {
  items: DashboardBudgetAnalysisRow[];
  meta: DashboardBudgetAnalysisDetailsMeta;
};

function appendBudgetAnalysisPeriodParams(
  searchParams: URLSearchParams,
  params: DashboardBudgetAnalysisPeriodParams,
) {
  searchParams.set('periodMode', params.periodMode);
  searchParams.set('year', String(params.year));
  if (params.month !== undefined) {
    searchParams.set('month', String(params.month));
  }
  if (params.professionalId) {
    searchParams.set('professionalId', params.professionalId);
  }
}

export async function fetchDashboardBudgetAnalysisStatus(
  storeId: string,
  params: DashboardBudgetAnalysisStatusParams,
): Promise<DashboardBudgetAnalysisStatusResult> {
  const searchParams = new URLSearchParams();
  appendBudgetAnalysisPeriodParams(searchParams, params);
  const path = `/v1/dashboard/budget-analysis/status?${searchParams.toString()}`;
  const res = await clinicaFetch<{ data: DashboardBudgetAnalysisStatusResult }>(
    storeId,
    path,
  );
  return res.data;
}

export async function fetchDashboardBudgetAnalysis(
  storeId: string,
  params: DashboardBudgetAnalysisParams,
): Promise<BudgetAnalysisAggregate[]> {
  const searchParams = new URLSearchParams();
  searchParams.set('status', params.status);
  searchParams.set('dimension', params.dimension);
  appendBudgetAnalysisPeriodParams(searchParams, params);
  const path = `/v1/dashboard/budget-analysis?${searchParams.toString()}`;
  const res = await clinicaFetch<{ data: BudgetAnalysisAggregate[] }>(
    storeId,
    path,
  );
  return res.data;
}

export async function fetchDashboardBudgetAnalysisDetails(
  storeId: string,
  params: DashboardBudgetAnalysisDetailsParams,
): Promise<DashboardBudgetAnalysisDetailsResult> {
  const searchParams = new URLSearchParams();
  searchParams.set('status', params.status);
  appendBudgetAnalysisPeriodParams(searchParams, params);
  if (params.dimension) searchParams.set('dimension', params.dimension);
  if (params.dimensionKey) {
    searchParams.set('dimensionKey', params.dimensionKey);
  }
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.perPage !== undefined) {
    searchParams.set('perPage', String(params.perPage));
  }
  if (params.search?.trim()) searchParams.set('search', params.search.trim());

  const path = `/v1/dashboard/budget-analysis/details?${searchParams.toString()}`;
  const res = await clinicaFetch<{
    data: DashboardBudgetAnalysisRow[];
    meta: DashboardBudgetAnalysisDetailsMeta;
  }>(storeId, path);

  return { items: res.data, meta: res.meta };
}

export type DashboardPatientAcquisitionParams = {
  periodMode: DashboardAcquisitionPeriodMode;
  year: number;
  month?: number;
};

export type DashboardPatientAcquisitionDetailsParams =
  DashboardPatientAcquisitionParams & {
    source: DashboardReferralSourceKey;
    page?: number;
    perPage?: number;
    search?: string;
  };

export type DashboardPatientAcquisitionDetailsMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type DashboardPatientAcquisitionDetailsResult = {
  items: DashboardAcquisitionPatient[];
  meta: DashboardPatientAcquisitionDetailsMeta;
};

function appendPatientAcquisitionPeriodParams(
  searchParams: URLSearchParams,
  params: DashboardPatientAcquisitionParams,
) {
  searchParams.set('periodMode', params.periodMode);
  searchParams.set('year', String(params.year));
  if (params.month !== undefined) {
    searchParams.set('month', String(params.month));
  }
}

export async function fetchDashboardPatientAcquisition(
  storeId: string,
  params: DashboardPatientAcquisitionParams,
): Promise<DashboardPatientAcquisitionResult> {
  const searchParams = new URLSearchParams();
  appendPatientAcquisitionPeriodParams(searchParams, params);
  const path = `/v1/dashboard/patient-acquisition?${searchParams.toString()}`;
  const res = await clinicaFetch<{ data: DashboardPatientAcquisitionResult }>(
    storeId,
    path,
  );
  return res.data;
}

export async function fetchDashboardPatientAcquisitionDetails(
  storeId: string,
  params: DashboardPatientAcquisitionDetailsParams,
): Promise<DashboardPatientAcquisitionDetailsResult> {
  const searchParams = new URLSearchParams();
  searchParams.set('source', params.source);
  appendPatientAcquisitionPeriodParams(searchParams, params);
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.perPage !== undefined) {
    searchParams.set('perPage', String(params.perPage));
  }
  if (params.search?.trim()) searchParams.set('search', params.search.trim());

  const path = `/v1/dashboard/patient-acquisition/details?${searchParams.toString()}`;
  const res = await clinicaFetch<{
    data: DashboardAcquisitionPatient[];
    meta: DashboardPatientAcquisitionDetailsMeta;
  }>(storeId, path);

  return {
    items: res.data.map((item) => ({
      ...item,
      email: item.email ?? '',
      cpf: item.cpf ?? undefined,
    })),
    meta: res.meta,
  };
}

export type DashboardPatientDemographicsParams = {
  gender?: DashboardGenderFilter;
};

export async function fetchDashboardPatientDemographics(
  storeId: string,
  params: DashboardPatientDemographicsParams = {},
): Promise<DashboardPatientDemographicsResult> {
  const searchParams = new URLSearchParams();
  if (params.gender && params.gender !== 'all') {
    searchParams.set('gender', params.gender);
  } else if (params.gender === 'all') {
    searchParams.set('gender', 'all');
  }
  const qs = searchParams.toString();
  const path = qs
    ? `/v1/dashboard/patient-demographics?${qs}`
    : '/v1/dashboard/patient-demographics';
  const res = await clinicaFetch<{ data: DashboardPatientDemographicsResult }>(
    storeId,
    path,
  );
  return res.data;
}

export type DashboardAppointmentsParams = {
  periodMode: ConsultasPeriodMode;
  year: number;
  month?: number;
  categoryId?: string;
};

export type DashboardAppointmentsDetailsParams = DashboardAppointmentsParams & {
  group: DashboardAppointmentGroup;
  page?: number;
  perPage?: number;
};

export type DashboardAppointmentsDetailsMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type DashboardAppointmentsDetailsResult = {
  items: DashboardAppointmentDetailRow[];
  meta: DashboardAppointmentsDetailsMeta;
};

function appendAppointmentsPeriodParams(
  searchParams: URLSearchParams,
  params: DashboardAppointmentsParams,
) {
  searchParams.set('periodMode', params.periodMode);
  searchParams.set('year', String(params.year));
  if (params.month !== undefined) {
    searchParams.set('month', String(params.month));
  }
  if (params.categoryId && params.categoryId !== 'all') {
    searchParams.set('categoryId', params.categoryId);
  }
}

export async function fetchDashboardAppointments(
  storeId: string,
  params: DashboardAppointmentsParams,
): Promise<DashboardAppointmentsResult> {
  const searchParams = new URLSearchParams();
  appendAppointmentsPeriodParams(searchParams, params);
  const path = `/v1/dashboard/appointments?${searchParams.toString()}`;
  const res = await clinicaFetch<{ data: DashboardAppointmentsResult }>(
    storeId,
    path,
  );
  return res.data;
}

export async function fetchDashboardAppointmentsDetails(
  storeId: string,
  params: DashboardAppointmentsDetailsParams,
): Promise<DashboardAppointmentsDetailsResult> {
  const searchParams = new URLSearchParams();
  searchParams.set('group', params.group);
  appendAppointmentsPeriodParams(searchParams, params);
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.perPage !== undefined) {
    searchParams.set('perPage', String(params.perPage));
  }

  const path = `/v1/dashboard/appointments/details?${searchParams.toString()}`;
  const res = await clinicaFetch<{
    data: DashboardAppointmentDetailRow[];
    meta: DashboardAppointmentsDetailsMeta;
  }>(storeId, path);

  return { items: res.data, meta: res.meta };
}

export type DashboardCashflowParams = {
  periodMode: CashflowPeriodMode;
  year: number;
  month?: number;
};

export async function fetchDashboardCashflow(
  storeId: string,
  params: DashboardCashflowParams,
): Promise<DashboardCashflowResult> {
  const searchParams = new URLSearchParams();
  searchParams.set('periodMode', params.periodMode);
  searchParams.set('year', String(params.year));
  if (params.month !== undefined) {
    searchParams.set('month', String(params.month));
  }
  const path = `/v1/dashboard/cashflow?${searchParams.toString()}`;
  const res = await clinicaFetch<{ data: DashboardCashflowResult }>(
    storeId,
    path,
  );
  return res.data;
}

export type DashboardCommissionsParams = {
  periodMode: CommissionsPeriodMode;
  year: number;
  month?: number;
};

export async function fetchDashboardCommissions(
  storeId: string,
  params: DashboardCommissionsParams,
): Promise<DashboardCommissionsResult> {
  const searchParams = new URLSearchParams();
  searchParams.set('periodMode', params.periodMode);
  searchParams.set('year', String(params.year));
  if (params.month !== undefined) {
    searchParams.set('month', String(params.month));
  }
  const path = `/v1/dashboard/commissions?${searchParams.toString()}`;
  const res = await clinicaFetch<{ data: DashboardCommissionsResult }>(
    storeId,
    path,
  );
  return res.data;
}

export type DashboardCommissionsDetailsParams = {
  startDate: string;
  endDate: string;
  professionalId?: string;
  page?: number;
  perPage?: number;
};

export async function fetchDashboardCommissionsDetails(
  storeId: string,
  params: DashboardCommissionsDetailsParams,
): Promise<{
  items: DashboardCommissionPaidRow[];
  meta: DashboardCommissionsDetailsMeta;
}> {
  const searchParams = new URLSearchParams();
  searchParams.set('startDate', params.startDate);
  searchParams.set('endDate', params.endDate);
  if (params.professionalId) {
    searchParams.set('professionalId', params.professionalId);
  }
  searchParams.set('page', String(params.page ?? 1));
  searchParams.set('perPage', String(params.perPage ?? 20));
  const path = `/v1/dashboard/commissions/details?${searchParams.toString()}`;
  const res = await clinicaFetch<{
    data: DashboardCommissionPaidRow[];
    meta: DashboardCommissionsDetailsMeta;
  }>(storeId, path);
  return { items: res.data, meta: res.meta };
}

export type DashboardPaymentMethodsParams = {
  startDate: string;
  endDate: string;
};

export async function fetchDashboardPaymentMethods(
  storeId: string,
  params: DashboardPaymentMethodsParams,
): Promise<DashboardPaymentMethodsResult> {
  const searchParams = new URLSearchParams();
  searchParams.set('startDate', params.startDate);
  searchParams.set('endDate', params.endDate);
  const path = `/v1/dashboard/payment-methods?${searchParams.toString()}`;
  const res = await clinicaFetch<{ data: DashboardPaymentMethodsResult }>(
    storeId,
    path,
  );
  return res.data;
}

export type DashboardTicketMedioParams = {
  periodMode: TicketMedioPeriodMode;
  year: number;
  month?: number;
};

export async function fetchDashboardTicketMedio(
  storeId: string,
  params: DashboardTicketMedioParams,
): Promise<DashboardTicketMedioResult> {
  const searchParams = new URLSearchParams();
  searchParams.set('periodMode', params.periodMode);
  searchParams.set('year', String(params.year));
  if (params.month !== undefined) {
    searchParams.set('month', String(params.month));
  }
  const path = `/v1/dashboard/ticket-medio?${searchParams.toString()}`;
  const res = await clinicaFetch<{ data: DashboardTicketMedioResult }>(
    storeId,
    path,
  );
  return res.data;
}

export type DashboardInadimplenciaParams = {
  periodMode: InadimplenciaPeriodMode;
  year: number;
  month?: number;
};

export async function fetchDashboardInadimplencia(
  storeId: string,
  params: DashboardInadimplenciaParams,
): Promise<DashboardInadimplenciaResult> {
  const searchParams = new URLSearchParams();
  searchParams.set('periodMode', params.periodMode);
  searchParams.set('year', String(params.year));
  if (params.month !== undefined) {
    searchParams.set('month', String(params.month));
  }
  const path = `/v1/dashboard/inadimplencia?${searchParams.toString()}`;
  const res = await clinicaFetch<{ data: DashboardInadimplenciaResult }>(
    storeId,
    path,
  );
  return res.data;
}

export type DashboardInadimplenciaDetailsParams = {
  periodMode: InadimplenciaPeriodMode;
  year: number;
  month?: number;
  page?: number;
  perPage?: number;
};

export async function fetchDashboardInadimplenciaDetails(
  storeId: string,
  params: DashboardInadimplenciaDetailsParams,
): Promise<{
  items: DashboardInadimplenciaDebtRow[];
  meta: DashboardInadimplenciaDetailsMeta;
}> {
  const searchParams = new URLSearchParams();
  searchParams.set('periodMode', params.periodMode);
  searchParams.set('year', String(params.year));
  if (params.month !== undefined) {
    searchParams.set('month', String(params.month));
  }
  searchParams.set('page', String(params.page ?? 1));
  searchParams.set('perPage', String(params.perPage ?? 20));
  const path = `/v1/dashboard/inadimplencia/details?${searchParams.toString()}`;
  const res = await clinicaFetch<{
    data: DashboardInadimplenciaDebtRow[];
    meta: DashboardInadimplenciaDetailsMeta;
  }>(storeId, path);
  return { items: res.data, meta: res.meta };
}

export type DashboardExpenseByCategoryParams = {
  periodMode: ExpenseByCategoryPeriodMode;
  year: number;
  month?: number;
};

export async function fetchDashboardExpenseByCategory(
  storeId: string,
  params: DashboardExpenseByCategoryParams,
): Promise<DashboardExpenseByCategoryResult> {
  const searchParams = new URLSearchParams();
  searchParams.set('periodMode', params.periodMode);
  searchParams.set('year', String(params.year));
  if (params.month !== undefined) {
    searchParams.set('month', String(params.month));
  }
  const path = `/v1/dashboard/expense-by-category?${searchParams.toString()}`;
  const res = await clinicaFetch<{ data: DashboardExpenseByCategoryResult }>(
    storeId,
    path,
  );
  return res.data;
}
