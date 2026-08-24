/** Status de orçamento no dashboard (mock; API futura pode divergir). */
export type DashboardBudgetStatus = 'open' | 'rejected';

export type DashboardBudgetRow = {
  id: string;
  budgetDate: string;
  patientId: string;
  patientName: string;
  description: string;
  status: DashboardBudgetStatus;
  valueCents: number;
};

export type DashboardBudgetAnalysisStatus =
  | 'open'
  | 'approved'
  | 'rejected';

export type DashboardBudgetAnalysisRow = {
  id: string;
  budgetDate: string;
  patientId: string;
  patientName: string;
  description: string;
  status: DashboardBudgetAnalysisStatus;
  valueCents: number;
  professionalId: string;
  professionalName: string;
  planId: string;
  planName: string;
  treatmentId: string;
  treatmentName: string;
};

export type BudgetPeriodMode = 'annual' | 'monthly';
export type BudgetChartMetric = 'quantity' | 'value';
export type BudgetAnalysisDimension =
  | 'professionals'
  | 'plans'
  | 'treatments';

export type BudgetStatusSummaryItem = {
  count: number;
  totalCents: number;
};

export type BudgetStatusSummary = Record<
  DashboardBudgetAnalysisStatus,
  BudgetStatusSummaryItem
> & {
  approvalRate: number;
  totalCount: number;
};

export type BudgetAnalysisAggregate = {
  key: string;
  name: string;
  count: number;
  totalCents: number;
};

/** Ponto da timeline da API (ambos count e cents; toggle no cliente). */
export type BudgetStatusTimelineApiPoint = {
  key: string;
  label: string;
  approved: BudgetStatusSummaryItem;
  rejected: BudgetStatusSummaryItem;
  open: BudgetStatusSummaryItem;
};

/** Ponto do gráfico Recharts (valores já escolhidos por métrica). */
export type BudgetStatusTimelinePoint = {
  key: string;
  label: string;
  approved: number;
  rejected: number;
  open: number;
};

export type DashboardBudgetAnalysisStatusResult = {
  summary: BudgetStatusSummary;
  timeline: BudgetStatusTimelineApiPoint[];
  professionals: Array<{ id: string; name: string }>;
  years: number[];
};

export type DashboardBirthdayPatient = {
  id: string;
  name: string;
  phone: string;
  birthDate: string;
  photoUrl?: string | null;
  status: 'active' | 'inactive';
};

export type DashboardOverdueIncome = {
  id: string;
  description: string;
  patientName: string | null;
  dueDate: string;
  valueCents: number;
};

export type DashboardSummary = {
  overdueIncomeTotalCents: number;
  openRejectedBudgetsTotalCents: number;
  upcomingBirthdaysCount: number;
};

export type BirthdayPeriodFilter =
  | 'next_30_days'
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'last_30_days'
  | 'custom';

export type BirthdayPeriodRange = {
  startDate: string;
  endDate: string;
};

export type BirthdayListItem = DashboardBirthdayPatient & {
  ageYears: number;
  daysUntil: number;
  relativeLabel: string;
};

/** Análise de Receitas — modo de visualização (mock frontend). */
export type RevenueAnalysisMode = 'receipts' | 'sales';

export type RevenueAnalysisDimension =
  | 'professionals'
  | 'plans'
  | 'treatments'
  | 'specialties';

export type RevenueSaleOrigin =
  | 'approved_budget'
  | 'treatment_in_progress'
  | 'manual_debit';

export type RevenueReceiptStatus = 'paid' | 'unpaid';

/** Período da análise — mesmo conjunto do filtro de aniversariantes. */
export type RevenuePeriodFilter = BirthdayPeriodFilter;

export type DashboardRevenueSale = {
  id: string;
  saleDate: string;
  patientId: string;
  patientName: string;
  treatmentId: string;
  treatmentName: string;
  planId: string;
  planName: string;
  specialtyId: string;
  specialtyName: string;
  professionalId: string;
  professionalName: string;
  origin: RevenueSaleOrigin;
  valueCents: number;
};

export type DashboardRevenueReceipt = {
  id: string;
  saleId: string;
  paidAt: string;
  status: RevenueReceiptStatus;
  valueCents: number;
};

export type RevenueDetailRow = {
  id: string;
  date: string;
  patientId: string;
  patientName: string;
  treatmentName: string;
  valueCents: number;
};

export type RevenueAggregateRow = {
  key: string;
  name: string;
  count: number;
  totalCents: number;
};

export type DashboardFinancialSummary = {
  income: {
    receivedCents: number;
    toReceiveCents: number;
    totalCents: number;
  };
  expense: {
    paidCents: number;
    toPayCents: number;
    totalCents: number;
  };
  balance: {
    currentCents: number;
    projectedCents: number;
  };
};

export type DashboardFinancialSummaryByPeriod = Record<
  string,
  DashboardFinancialSummary
>;

export type DashboardPatientMetricId =
  | 'total_registered'
  | 'birthdays'
  | 'seen_last_6_months'
  | 'overdue_debts'
  | 'new_seen_this_month'
  | 'open_treatment_without_appointment';

/** Métricas listáveis via `GET /v1/dashboard/patients` (sem birthdays). */
export type DashboardPatientsListMetricId = Exclude<
  DashboardPatientMetricId,
  'birthdays'
>;

export type DashboardPatientMetricItem = {
  id: string;
  name: string;
  phone: string;
  landlinePhone?: string;
  email?: string;
  cpf?: string;
  detail?: string;
  valueCents?: number;
};

export type DashboardPatientMetric = {
  id: DashboardPatientMetricId;
  label: string;
  patients: DashboardPatientMetricItem[];
};

/** Contagens do card Pacientes (aniversariantes vêm do summary geral). */
export type DashboardPatientsSummary = {
  totalRegisteredCount: number;
  seenLast6MonthsCount: number;
  overdueDebtsPatientsCount: number;
  newSeenThisMonthCount: number;
  openTreatmentWithoutAppointmentCount: number;
};

export type DashboardDailySale = {
  date: string;
  valueCents: number;
};

/** Feriado usado no cálculo de dias úteis do card Metas de Vendas. */
export type DashboardHoliday = {
  /** Dia civil `yyyy-MM-dd`. */
  date: string;
  name: string;
};

/**
 * Resposta de `GET /v1/dashboard/sales-goals` — meta contínua ativa da loja.
 * O acúmulo começa em `startDate` e não reseta na virada de mês.
 */
export type DashboardSalesGoalsSummary = {
  goalCents: number | null;
  startDate: string | null;
  realizedCents: number;
  soldTodayCents: number;
  reached: boolean;
  dailySales: DashboardDailySale[];
};

export type SalesGoalTimelinePoint = {
  day: number;
  /** Dia civil `yyyy-MM-dd`. */
  date: string;
  label: string;
  /** Vendas acumuladas até o dia (reais, eixo do gráfico). */
  realizedCumulative: number;
  /** Meta esperada acumulada até o dia (reais; rampa por dia útil). */
  expected: number;
  realizedCumulativeCents: number;
  expectedCumulativeCents: number;
};

/** Período anual/mensal (mesmos modos de Orçamentos). */
export type DashboardAcquisitionPeriodMode = 'annual' | 'monthly';

export type DashboardReferralSourceKey =
  | 'indicacao'
  | 'indicacao_profissional'
  | 'indicacao_profissional_externo'
  | 'google'
  | 'instagram'
  | 'facebook'
  | 'outro'
  | 'nao_informado';

export type DashboardAcquisitionPatient = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  cpf?: string;
  /** Data de cadastro `yyyy-MM-dd`. */
  registeredAt: string;
  referralSource: DashboardReferralSourceKey;
};

export type DashboardAcquisitionAggregate = {
  source: DashboardReferralSourceKey;
  label: string;
  color: string;
  count: number;
  percent: number;
};

/** Resposta de `GET /v1/dashboard/patient-acquisition` (cores ficam no FE). */
export type DashboardPatientAcquisitionResult = {
  totalCount: number;
  aggregates: Array<{
    source: DashboardReferralSourceKey;
    label: string;
    count: number;
    percent: number;
  }>;
  years: number[];
};

export type DashboardPatientGender = 'male' | 'female' | 'uninformed';

export type DashboardGenderFilter = 'all' | DashboardPatientGender;

export type DashboardDemographicPatient = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  /** `yyyy-MM-dd` ou null se idade não informada. */
  birthDate: string | null;
  gender: DashboardPatientGender;
};

export type DashboardAgeBucketKey =
  | 'unknown'
  | '0-9'
  | '10-19'
  | '20-29'
  | '30-39'
  | '40-49'
  | '50-59'
  | '60-69'
  | '70-79'
  | '80-89'
  | '90-99'
  | '100+';

export type DashboardAgeSeriesPoint = {
  key: string;
  label: string;
  count: number;
  percent: number;
};

export type DashboardGenderShare = {
  gender: DashboardPatientGender;
  label: string;
  color: string;
  count: number;
  percent: number;
};

/** Resposta de `GET /v1/dashboard/patient-demographics` (cores ficam no FE). */
export type DashboardPatientDemographicsResult = {
  filteredTotalCount: number;
  totalCount: number;
  ageSeries: DashboardAgeSeriesPoint[];
  genderShares: Array<{
    gender: DashboardPatientGender;
    label: string;
    count: number;
    percent: number;
  }>;
};

/** Categoria de agendamento no dashboard (mock; alinhada à agenda). */
export type DashboardAppointmentCategory = {
  id: string;
  name: string;
  color: string;
};

/** Outcomes terminais usados no card Consultas. */
export type DashboardAppointmentOutcome =
  | 'finished'
  | 'missed'
  | 'cancelled_patient'
  | 'cancelled_pro';

export type DashboardAppointmentRow = {
  id: string;
  /** Data da consulta `yyyy-MM-dd`. */
  date: string;
  patientId: string;
  patientName: string;
  phone: string;
  categoryId: string;
  categoryName: string;
  status: DashboardAppointmentOutcome;
  professionalName: string;
};

export type ConsultasPeriodMode = 'annual' | 'monthly';

export type DashboardAppointmentGroup = 'realized' | 'missed_cancelled';

export type DashboardAppointmentsSummary = {
  realizedCount: number;
  missedCancelledCount: number;
  totalCount: number;
  /** `finished / (finished + missed + cancelled_*) * 100`. */
  attendanceRate: number;
};

export type DashboardAppointmentsTimelinePoint = {
  key: string;
  label: string;
  realized: number;
  missedCancelled: number;
};

/** Resposta de `GET /v1/dashboard/appointments`. */
export type DashboardAppointmentsResult = {
  summary: DashboardAppointmentsSummary;
  timeline: DashboardAppointmentsTimelinePoint[];
  categories: DashboardAppointmentCategory[];
  years: number[];
};

/** Item de `GET /v1/dashboard/appointments/details` (nome do profissional no FE). */
export type DashboardAppointmentDetailRow = {
  id: string;
  date: string;
  patientId: string;
  patientName: string;
  phone: string;
  categoryId: string | null;
  categoryName: string;
  status: DashboardAppointmentOutcome;
  professionalId: string;
};

/** Lançamento de caixa para o card Receitas x Despesas (mock). */
export type DashboardCashflowSide = 'income' | 'expense';

export type DashboardCashflowEntry = {
  id: string;
  side: DashboardCashflowSide;
  /** Data de competência/vencimento `yyyy-MM-dd`. */
  dueDate: string;
  /** Data do pagamento; `null` = não liquidado. */
  paidAt: string | null;
  valueCents: number;
};

export type CashflowPeriodMode = 'annual' | 'monthly';

export type DashboardCashflowTotals = {
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
};

export type DashboardCashflowTimelinePoint = {
  key: string;
  label: string;
  /** Reais (não centavos) para o eixo do gráfico. */
  incomePaid: number;
  incomeForecast: number;
  expensePaid: number;
  expenseForecast: number;
  /** Saldo cumulativo só liquidados (reais). */
  balance: number;
  /** Saldo cumulativo liquidados + previstos (reais). */
  balanceForecast: number;
};

/** Resposta de `GET /v1/dashboard/cashflow`. */
export type DashboardCashflowResult = {
  totals: DashboardCashflowTotals;
  timeline: DashboardCashflowTimelinePoint[];
  years: number[];
};

/** Comissões pagas — card Análise das Comissões Pagas (mock). */
export type DashboardCommissionTrigger =
  | 'treatment_completed'
  | 'debit_received'
  | 'budget_approved';

export type DashboardCommissionType = 'fixed_value' | 'percentage';

export type DashboardCommissionPaidRow = {
  id: string;
  /** Data do pagamento da comissão `yyyy-MM-dd`. */
  paidAt: string;
  professionalId: string;
  professionalName: string;
  trigger: DashboardCommissionTrigger;
  commissionType: DashboardCommissionType;
  /** Valor bruto (sem desconto). */
  grossCents: number;
  discountCents: number;
  /** Valor líquido pago ao profissional. */
  netCents: number;
  patientName: string;
  planName: string;
  specialtyName: string;
  treatmentName: string;
  /** Valor do tratamento (tabela do dialog). */
  treatmentValueCents: number;
  /** Custo do tratamento (tabela do dialog). */
  treatmentCostCents: number;
  /** Parcela do pagamento do paciente (`1/3`, etc.) — null se à vista. */
  installment: string | null;
};

/** Agrupamento do dialog Ver — mesma hierarquia do financeiro (regra + plano + especialidade + tratamento). */
export type DashboardCommissionRuleGroup = {
  id: string;
  trigger: DashboardCommissionTrigger;
  triggerLabel: string;
  planName: string;
  specialtyName: string;
  treatmentSummary: string;
  totalNetCents: number;
  rows: DashboardCommissionPaidRow[];
};

export type CommissionsPeriodMode = 'annual' | 'monthly';

export type DashboardCommissionBreakdownItem = {
  key: string;
  label: string;
  grossCents: number;
  percent: number;
};

export type DashboardCommissionProfessionalRank = {
  professionalId: string;
  professionalName: string;
  netCents: number;
  count: number;
};

/** Resposta de `GET /v1/dashboard/commissions`. */
export type DashboardCommissionsResult = {
  netTotalCents: number;
  byTrigger: DashboardCommissionBreakdownItem[];
  byType: DashboardCommissionBreakdownItem[];
  ranking: DashboardCommissionProfessionalRank[];
  years: number[];
};

export type DashboardCommissionsDetailsMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  totalNetCents: number;
};

/** Recebimentos por meio de pagamento. */
export type DashboardPaymentMethodKey =
  | 'cash'
  | 'credit'
  | 'debit'
  | 'pix'
  | 'transfer'
  | 'boleto'
  | 'check';

/** Resposta de `GET /v1/dashboard/payment-methods`. */
export type DashboardPaymentMethodsResult = {
  totalCents: number;
  items: Array<{
    method: DashboardPaymentMethodKey;
    amountCents: number;
  }>;
};

/** Recebimento individual — fixtures/testes (card consome o agregado da API). */
export type DashboardPaymentMethodReceipt = {
  id: string;
  /** Data do recebimento `yyyy-MM-dd` (pago ou agendado/transacionado). */
  paidAt: string;
  paymentMethod: DashboardPaymentMethodKey;
  amountCents: number;
  patientName: string;
  description: string;
};

export type DashboardPaymentMethodSummaryItem = {
  method: DashboardPaymentMethodKey;
  label: string;
  amountCents: number;
  percent: number;
  color: string;
};

export type DashboardPaymentMethodSummary = {
  totalCents: number;
  items: DashboardPaymentMethodSummaryItem[];
};

/** Ticket médio — card com 2 line charts (API). */
export type TicketMedioPeriodMode = 'annual' | 'monthly';

/** Métrica diária bruta (fixtures de teste / helpers locais). */
export type DashboardTicketMedioDayMetric = {
  /** `yyyy-MM-dd` */
  date: string;
  revenueCents: number;
  expenseCents: number;
  /** Pacientes distintos no dia (para rendimento médio). */
  patientCount: number;
};

export type DashboardTicketMedioPoint = {
  key: string;
  label: string;
  currentCents: number;
  previousCents: number;
};

export type DashboardTicketMedioSeries = {
  currentAverageCents: number;
  points: DashboardTicketMedioPoint[];
};

export type DashboardTicketMedioReport = {
  rendimento: DashboardTicketMedioSeries;
  lucratividade: DashboardTicketMedioSeries;
};

export type DashboardTicketMedioResult = DashboardTicketMedioReport & {
  years: number[];
};

export type DashboardTicketMedioYAxis = {
  domain: [number, number];
  ticks: number[];
};

/** Inadimplência — pizza + taxa no período (API). */
export type InadimplenciaPeriodMode = 'annual' | 'monthly';

/** Débito bruto (fixtures/testes de lib). */
export type DashboardInadimplenciaDebt = {
  id: string;
  /** `yyyy-MM-dd` — vencimento do débito */
  dueDate: string;
  patientId: string;
  patientName: string;
  description: string;
  phone: string;
  /** Valor total bruto do débito */
  totalCents: number;
  /** Valor bruto ainda não recebido */
  unpaidCents: number;
  /**
   * Paciente inadimplente no momento da geração do gráfico.
   * Débitos de pacientes já regularizados não entram no cálculo.
   */
  patientCurrentlyDelinquent: boolean;
};

/** Linha do dialog VER / PDF (API details). */
export type DashboardInadimplenciaDebtRow = {
  id: string;
  dueDate: string;
  daysOverdue: number;
  patientId: string;
  patientName: string;
  description: string;
  phone: string | null;
  unpaidCents: number;
};

export type DashboardInadimplenciaSliceKey = 'unpaid' | 'received';

export type DashboardInadimplenciaSlice = {
  key: DashboardInadimplenciaSliceKey;
  label: string;
  valueCents: number;
  percent: number;
  color: string;
};

export type DashboardInadimplenciaReport = {
  totalDebtsCents: number;
  unpaidCents: number;
  receivedCents: number;
  /** (não recebido / total débitos) × 100 */
  ratePercent: number;
  slices: DashboardInadimplenciaSlice[];
};

export type DashboardInadimplenciaResult = {
  totalDebtsCents: number;
  unpaidCents: number;
  receivedCents: number;
  ratePercent: number;
  years: number[];
};

export type DashboardInadimplenciaDetailsMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

/** Despesa por categoria — pizza + legenda (API). */
export type ExpenseByCategoryPeriodMode = 'annual' | 'monthly';

/** Entry bruta (fixtures/testes de lib). */
export type DashboardExpenseByCategoryEntry = {
  id: string;
  /** `yyyy-MM-dd` */
  date: string;
  categoryId: string;
  categoryName: string;
  amountCents: number;
};

export type DashboardExpenseCategorySummaryItem = {
  categoryId: string;
  label: string;
  color: string;
  amountCents: number;
  percent: number;
};

export type DashboardExpenseByCategorySummary = {
  totalCents: number;
  items: DashboardExpenseCategorySummaryItem[];
};

export type DashboardExpenseByCategoryResult =
  DashboardExpenseByCategorySummary & {
    years: number[];
  };
