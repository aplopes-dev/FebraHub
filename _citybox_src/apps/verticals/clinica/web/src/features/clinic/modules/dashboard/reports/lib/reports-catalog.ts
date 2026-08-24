import type {
  ReportCatalogGroup,
  ReportId,
  ReportsHeaderFilterKind,
} from '../types/clinic-reports';

export const REPORTS_CATALOG: readonly ReportCatalogGroup[] = [
  {
    id: 'patients',
    label: 'Pacientes',
    items: [{ id: 'birthdays', label: 'Aniversariantes' }],
  },
  {
    id: 'appointments',
    label: 'Agendamentos',
    items: [
      {
        id: 'open_treatments_without_appointment',
        label: 'Pacientes com procedimentos abertos sem consulta',
      },
    ],
  },
  {
    id: 'sales',
    label: 'Vendas',
    items: [
      { id: 'approved_budgets', label: 'Orçamentos aprovados' },
      { id: 'open_budgets', label: 'Orçamentos em aberto' },
      { id: 'rejected_budgets', label: 'Orçamentos reprovados' },
      { id: 'sales_by_specialty', label: 'Vendas por especialidades' },
      { id: 'sales_by_plan', label: 'Vendas por planos' },
      { id: 'sales_by_professional', label: 'Vendas por profissional' },
      { id: 'sales_by_treatment', label: 'Vendas por procedimentos' },
    ],
  },
  {
    id: 'financial',
    label: 'Financeiro',
    items: [
      { id: 'expenses_by_category', label: 'Despesas por categoria' },
      { id: 'excluded_revenues', label: 'Receitas excluídas' },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    items: [{ id: 'referred_patients', label: 'Pacientes indicados' }],
  },
] as const;

export const DEFAULT_REPORT_ID: ReportId = 'birthdays';

const REPORTS_WITHOUT_PERIOD = new Set<ReportId>([
  'open_treatments_without_appointment',
]);

const REPORTS_WITH_BUDGET_PERIOD = new Set<ReportId>([
  'approved_budgets',
  'open_budgets',
  'rejected_budgets',
  'sales_by_specialty',
  'sales_by_plan',
  'sales_by_professional',
  'sales_by_treatment',
  'expenses_by_category',
  'referred_patients',
]);

export function getReportFilterKind(
  reportId: ReportId,
): ReportsHeaderFilterKind {
  if (REPORTS_WITHOUT_PERIOD.has(reportId)) return 'none';
  if (REPORTS_WITH_BUDGET_PERIOD.has(reportId)) return 'budget';
  return 'relative';
}

export function getReportLabel(reportId: ReportId): string {
  for (const group of REPORTS_CATALOG) {
    const item = group.items.find((entry) => entry.id === reportId);
    if (item) return item.label;
  }
  return reportId;
}
