import { describe, expect, it } from 'vitest';
import {
  MOCK_DASHBOARD_REVENUE_RECEIPTS,
  MOCK_DASHBOARD_REVENUE_SALES,
} from '../data/mock-clinic-dashboard';
import {
  aggregateRevenueAnalysis,
  filterRevenueDetailRows,
  formatDimensionCountLabel,
  formatRevenueCountLabel,
  formatRevenueValueLabel,
} from './revenue-analysis';
import {
  DEFAULT_REVENUE_PERIOD,
  formatRevenuePdfPeriodLabel,
  REVENUE_PERIOD_OPTIONS,
  resolveRevenuePeriodRange,
} from './revenue-analysis-period';

const REF = new Date(2026, 6, 17);

describe('revenue-analysis-period', () => {
  it('defaults to today and lists periods in product order', () => {
    expect(DEFAULT_REVENUE_PERIOD).toBe('today');
    expect(REVENUE_PERIOD_OPTIONS.map((option) => option.value)).toEqual([
      'today',
      'this_week',
      'this_month',
      'last_30_days',
      'next_30_days',
      'custom',
    ]);
  });

  it('resolves today as a single local day', () => {
    expect(resolveRevenuePeriodRange('today', REF)).toEqual({
      startDate: '2026-07-17',
      endDate: '2026-07-17',
    });
  });
});

describe('formatRevenuePdfPeriodLabel', () => {
  const today = new Date(2026, 7, 18);

  it('uses the calendar date for today, not the filter label', () => {
    expect(formatRevenuePdfPeriodLabel('today', today)).toBe('18/08/2026');
  });

  it('uses MM/yyyy for a full calendar month', () => {
    expect(formatRevenuePdfPeriodLabel('this_month', today)).toBe('08/2026');
  });

  it('uses a date range for rolling windows', () => {
    expect(formatRevenuePdfPeriodLabel('last_30_days', today)).toBe(
      '19/07/2026 a 18/08/2026',
    );
  });

  it('uses the chosen custom dates', () => {
    expect(
      formatRevenuePdfPeriodLabel(
        'custom',
        today,
        new Date(2026, 7, 1),
        new Date(2026, 7, 10),
      ),
    ).toBe('01/08/2026 a 10/08/2026');
  });
});

describe('revenue-analysis', () => {
  it('receipts mode includes only paid values by payment date', () => {
    const rows = filterRevenueDetailRows({
      mode: 'receipts',
      sales: MOCK_DASHBOARD_REVENUE_SALES,
      receipts: MOCK_DASHBOARD_REVENUE_RECEIPTS,
      period: 'today',
      referenceDate: REF,
    });

    expect(rows.map((row) => row.id).sort()).toEqual(['rcp-001', 'rcp-002']);
    expect(rows.reduce((sum, row) => sum + row.valueCents, 0)).toBe(111000);
  });

  it('receipts mode ignores unpaid installments', () => {
    const rows = filterRevenueDetailRows({
      mode: 'receipts',
      sales: MOCK_DASHBOARD_REVENUE_SALES,
      receipts: MOCK_DASHBOARD_REVENUE_RECEIPTS,
      period: 'this_month',
      referenceDate: REF,
    });

    expect(rows.some((row) => row.id === 'rcp-003b')).toBe(false);
    expect(rows.some((row) => row.id === 'rcp-006b')).toBe(false);
    expect(rows.some((row) => row.id === 'rcp-003a')).toBe(true);
  });

  it('sales mode counts each sale once by sale date including all origins', () => {
    const rows = filterRevenueDetailRows({
      mode: 'sales',
      sales: MOCK_DASHBOARD_REVENUE_SALES,
      receipts: MOCK_DASHBOARD_REVENUE_RECEIPTS,
      period: 'this_month',
      referenceDate: REF,
    });

    const ids = rows.map((row) => row.id).sort();
    expect(ids).toContain('sale-001');
    expect(ids).toContain('sale-002');
    expect(ids).toContain('sale-003');
    expect(ids).toContain('sale-004');
    expect(ids).toContain('sale-006');
    expect(ids).not.toContain('sale-005');
    expect(ids).not.toContain('sale-007');
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('aggregates by professional without double-counting sales', () => {
    const aggregates = aggregateRevenueAnalysis({
      mode: 'sales',
      dimension: 'professionals',
      sales: MOCK_DASHBOARD_REVENUE_SALES,
      receipts: MOCK_DASHBOARD_REVENUE_RECEIPTS,
      period: 'today',
      referenceDate: REF,
    });

    expect(aggregates).toEqual([
      {
        key: 'pro-dra-marina',
        name: 'Dra. Marina Alves',
        count: 1,
        totalCents: 89000,
      },
      {
        key: 'pro-dr-carlos',
        name: 'Dr. Carlos Mendes',
        count: 1,
        totalCents: 22000,
      },
    ]);
  });

  it('aggregates receipts by plan using paid amounts', () => {
    const aggregates = aggregateRevenueAnalysis({
      mode: 'receipts',
      dimension: 'plans',
      sales: MOCK_DASHBOARD_REVENUE_SALES,
      receipts: MOCK_DASHBOARD_REVENUE_RECEIPTS,
      period: 'today',
      referenceDate: REF,
    });

    expect(aggregates).toEqual([
      {
        key: 'plan-estetica',
        name: 'Estética',
        count: 1,
        totalCents: 89000,
      },
      {
        key: 'plan-preventivo',
        name: 'Preventivo',
        count: 1,
        totalCents: 22000,
      },
    ]);
  });

  it('filters detail rows by dimension key', () => {
    const rows = filterRevenueDetailRows({
      mode: 'sales',
      sales: MOCK_DASHBOARD_REVENUE_SALES,
      receipts: MOCK_DASHBOARD_REVENUE_RECEIPTS,
      period: 'this_month',
      referenceDate: REF,
      dimension: 'professionals',
      dimensionKey: 'pro-dra-marina',
    });

    expect(rows.every((row) => row.id.startsWith('sale-'))).toBe(true);
    expect(rows.map((row) => row.id).sort()).toEqual([
      'sale-001',
      'sale-003',
      'sale-006',
      'sale-008',
      'sale-010',
    ]);
  });

  it('formats contextual labels for receipts and sales', () => {
    expect(formatRevenueCountLabel('receipts', 1)).toBe('1 receita');
    expect(formatRevenueCountLabel('receipts', 3)).toBe('3 receitas');
    expect(formatRevenueCountLabel('sales', 1)).toBe('1 procedimento');
    expect(formatRevenueCountLabel('sales', 2)).toBe('2 procedimentos');
    expect(formatRevenueValueLabel('receipts')).toBe('Receitas');
    expect(formatRevenueValueLabel('sales')).toBe('Vendas');
    expect(formatDimensionCountLabel('professionals', 4)).toBe('4 profissionais');
  });

  it('includeWithoutRevenue lists treatments without paid receipts in the period', () => {
    const sales = [
      {
        id: 'sale-pending',
        saleDate: '2026-08-01',
        patientId: 'pat-x',
        patientName: 'Paciente X',
        treatmentId: 'trt-canal',
        treatmentName: 'Tratamento de canal',
        planId: 'plan-preventivo',
        planName: 'Preventivo',
        specialtyId: 'spec-clinica',
        specialtyName: 'Clínica geral',
        professionalId: 'pro-dr-carlos',
        professionalName: 'Dr. Carlos Mendes',
        origin: 'manual_debit' as const,
        valueCents: 50000,
      },
    ];
    const receipts = [
      {
        id: 'rcp-pending',
        saleId: 'sale-pending',
        paidAt: '2026-08-01',
        status: 'unpaid' as const,
        valueCents: 50000,
      },
    ];

    const withoutFlag = aggregateRevenueAnalysis({
      mode: 'receipts',
      dimension: 'treatments',
      sales,
      receipts,
      period: 'next_30_days',
      referenceDate: REF,
    });
    const withFlag = aggregateRevenueAnalysis({
      mode: 'receipts',
      dimension: 'treatments',
      sales,
      receipts,
      period: 'next_30_days',
      referenceDate: REF,
      includeWithoutRevenue: true,
    });

    expect(withoutFlag).toEqual([]);
    expect(withFlag).toEqual([
      {
        key: 'trt-canal',
        name: 'Tratamento de canal',
        count: 0,
        totalCents: 0,
      },
    ]);
  });
});
