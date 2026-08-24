import { describe, expect, it } from 'vitest';
import {
  MOCK_DASHBOARD_BIRTHDAY_PATIENTS,
  MOCK_DASHBOARD_BUDGETS,
  MOCK_DASHBOARD_REVENUE_RECEIPTS,
  MOCK_DASHBOARD_REVENUE_SALES,
} from '../data/mock-clinic-dashboard';
import {
  buildDashboardBudgetsPdf,
  buildDashboardBudgetsPdfFileName,
} from './build-dashboard-budgets-pdf';
import {
  buildDashboardBirthdaysPdf,
  buildDashboardBirthdaysPdfFileName,
} from './build-dashboard-birthdays-pdf';
import {
  buildRevenueAnalysisDetailPdf,
  buildRevenueAnalysisDetailPdfFileName,
  buildRevenueAnalysisSummaryPdf,
  buildRevenueAnalysisSummaryPdfFileName,
} from './build-dashboard-revenue-analysis-pdf';
import {
  buildDashboardPatientMetricPdf,
  buildDashboardPatientMetricPdfFileName,
} from './build-dashboard-patient-metric-pdf';
import {
  buildBudgetAnalysisDetailPdf,
  buildBudgetAnalysisPdfFileName,
  buildBudgetAnalysisSummaryPdf,
  buildBudgetStatusPdf,
  buildBudgetStatusPdfFileName,
} from './build-dashboard-budget-analysis-pdf';
import { MOCK_DASHBOARD_BUDGET_ANALYSIS } from '../data/mock-dashboard-budget-analysis';
import { MOCK_DASHBOARD_PATIENT_METRICS } from '../data/mock-dashboard-patient-metrics';
import { filterBirthdayPatients } from './birthday-period';
import {
  aggregateDashboardBudgets,
  summarizeDashboardBudgetStatus,
} from './budget-analysis';
import {
  aggregateRevenueAnalysis,
  filterRevenueDetailRows,
} from './revenue-analysis';

describe('dashboard PDF builders', () => {
  it('builds budgets pdf blob and file name', async () => {
    const blob = await buildDashboardBudgetsPdf({
      budgets: MOCK_DASHBOARD_BUDGETS,
      generatedAt: new Date('2026-07-17T12:00:00.000Z'),
    });

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
    expect(buildDashboardBudgetsPdfFileName(new Date('2026-07-17T12:00:00.000Z'))).toContain(
      'orcamentos-abertos-reprovados',
    );
  });

  it('builds budgets pdf with long descriptions without truncating', async () => {
    const longDescription =
      'Tratamento ortodôntico completo com aparelho autoligado, manutenção mensal, ' +
      'contenção superior e inferior, clareamento pós-tratamento e acompanhamento ' +
      'radiográfico semestral durante 24 meses';

    const blob = await buildDashboardBudgetsPdf({
      budgets: MOCK_DASHBOARD_BUDGETS.map((budget) => ({
        ...budget,
        description: longDescription,
      })),
      generatedAt: new Date('2026-07-17T12:00:00.000Z'),
    });

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
  });

  it('builds birthdays pdf blob and file name', async () => {
    const items = filterBirthdayPatients({
      patients: MOCK_DASHBOARD_BIRTHDAY_PATIENTS,
      period: 'next_30_days',
      referenceDate: new Date(2026, 6, 17),
    });

    const blob = await buildDashboardBirthdaysPdf({
      items,
      periodLabel: 'dos próximos 30 dias',
      generatedAt: new Date('2026-07-17T12:00:00.000Z'),
    });

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
    expect(buildDashboardBirthdaysPdfFileName(new Date('2026-07-17T12:00:00.000Z'))).toContain(
      'aniversariantes',
    );
  });

  it('builds revenue analysis summary and detail pdfs', async () => {
    const generatedAt = new Date('2026-07-17T12:00:00.000Z');
    const aggregates = aggregateRevenueAnalysis({
      mode: 'receipts',
      dimension: 'professionals',
      sales: MOCK_DASHBOARD_REVENUE_SALES,
      receipts: MOCK_DASHBOARD_REVENUE_RECEIPTS,
      period: 'today',
      referenceDate: new Date(2026, 6, 17),
    });
    const details = filterRevenueDetailRows({
      mode: 'receipts',
      sales: MOCK_DASHBOARD_REVENUE_SALES,
      receipts: MOCK_DASHBOARD_REVENUE_RECEIPTS,
      period: 'today',
      referenceDate: new Date(2026, 6, 17),
      dimension: 'professionals',
      dimensionKey: aggregates[0]?.key,
    });

    const summaryBlob = await buildRevenueAnalysisSummaryPdf({
      title: 'Análise de Receitas',
      modeLabel: 'Recebimentos',
      periodLabel: '17/07/2026',
      dimensionLabel: 'Profissionais',
      mode: 'receipts',
      aggregates,
      generatedAt,
    });
    const detailBlob = await buildRevenueAnalysisDetailPdf({
      title: 'Análise de Receitas',
      modeLabel: 'Recebimentos',
      periodLabel: '17/07/2026',
      itemName: aggregates[0]?.name ?? 'Item',
      mode: 'receipts',
      details,
      generatedAt,
    });

    expect(summaryBlob).toBeInstanceOf(Blob);
    expect(summaryBlob.size).toBeGreaterThan(0);
    expect(detailBlob).toBeInstanceOf(Blob);
    expect(detailBlob.size).toBeGreaterThan(0);
    expect(buildRevenueAnalysisSummaryPdfFileName(generatedAt)).toContain(
      'analise-receitas',
    );
    expect(
      buildRevenueAnalysisDetailPdfFileName(
        aggregates[0]?.name ?? 'Item',
        generatedAt,
      ),
    ).toContain('analise-receitas');
  });

  it('builds patient metric pdf blob and file name', async () => {
    const metric = MOCK_DASHBOARD_PATIENT_METRICS[3]!;
    const generatedAt = new Date('2026-07-17T12:00:00.000Z');
    const blob = await buildDashboardPatientMetricPdf({
      metricLabel: metric.label,
      patients: metric.patients,
      showValueColumn: true,
      generatedAt,
    });

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
    expect(
      buildDashboardPatientMetricPdfFileName(metric.label, generatedAt),
    ).toContain('pacientes-com-debitos-em-atraso');
  });

  it('builds budget analysis pdf blobs and file names', async () => {
    const generatedAt = new Date('2026-07-17T12:00:00.000Z');
    const summary = summarizeDashboardBudgetStatus(MOCK_DASHBOARD_BUDGET_ANALYSIS);
    const aggregates = aggregateDashboardBudgets(
      MOCK_DASHBOARD_BUDGET_ANALYSIS,
      'professionals',
    );
    const statusBlob = await buildBudgetStatusPdf({
      summary,
      metric: 'quantity',
      periodLabel: 'Anual 2026',
      professionalLabel: 'Todos os profissionais',
      generatedAt,
    });
    const summaryBlob = await buildBudgetAnalysisSummaryPdf({
      title: 'Análise de Orçamentos — Aprovados',
      periodLabel: 'Anual 2026',
      professionalLabel: 'Todos os profissionais',
      aggregates,
    });
    const detailBlob = await buildBudgetAnalysisDetailPdf({
      title: `Orçamentos aprovados - profissional ${aggregates[0]?.name ?? 'Item'}`,
      budgets: MOCK_DASHBOARD_BUDGET_ANALYSIS.filter(
        (row) => row.professionalId === aggregates[0]?.key,
      ),
    });

    expect(statusBlob).toBeInstanceOf(Blob);
    expect(statusBlob.size).toBeGreaterThan(0);
    expect(summaryBlob).toBeInstanceOf(Blob);
    expect(summaryBlob.size).toBeGreaterThan(0);
    expect(detailBlob).toBeInstanceOf(Blob);
    expect(detailBlob.size).toBeGreaterThan(0);
    expect(buildBudgetStatusPdfFileName(generatedAt)).toContain('status-orcamentos');
    expect(
      buildBudgetAnalysisPdfFileName(aggregates[0]?.name ?? 'Item', generatedAt),
    ).toContain('analise-orcamentos');
  });
});
