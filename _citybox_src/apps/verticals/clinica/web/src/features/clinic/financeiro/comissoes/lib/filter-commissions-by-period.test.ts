import { describe, expect, it } from 'vitest';
import {
  filterHistoryCommissionsByPeriod,
  filterOpenCommissionsByPeriod,
  filterCommissionRowByPeriod,
  resolveCommissionPeriodDates,
} from './filter-commissions-by-period';
import type { CommissionSummaryRow } from '../types/commission-financial.types';

const openFixture: CommissionSummaryRow[] = [
  {
    professionalId: 'prof-1',
    professionalName: 'Danillo',
    totalCents: 30000,
    hasCommissionConfigured: true,
    ruleGroups: [
      {
        id: 'g1',
        triggerLabel: 'Débito recebido do paciente',
        planName: 'Particular',
        specialtyName: 'Cirurgia',
        treatmentSummary: 'Extração',
        totalCommissionCents: 20000,
        rows: [
          {
            id: 'r1',
            paidAt: '2026-07-10',
            patientName: 'Maria',
            treatmentName: 'Extração',
            paidValueCents: 10000,
            treatmentCostCents: 8000,
            installment: null,
            commissionCents: 20000,
          },
        ],
      },
      {
        id: 'g2',
        triggerLabel: 'Procedimento finalizado',
        planName: 'Plano 1',
        specialtyName: 'Orto',
        treatmentSummary: 'Aparelho',
        totalCommissionCents: 10000,
        rows: [
          {
            id: 'r2',
            paidAt: '2026-06-15',
            patientName: 'João',
            treatmentName: 'Aparelho',
            paidValueCents: 50000,
            treatmentCostCents: 40000,
            installment: null,
            commissionCents: 10000,
          },
        ],
      },
    ],
  },
  {
    professionalId: 'prof-2',
    professionalName: 'Fernanda',
    totalCents: 5000,
    hasCommissionConfigured: true,
    ruleGroups: [
      {
        id: 'g3',
        triggerLabel: 'Débito recebido do paciente',
        planName: 'Particular',
        specialtyName: 'Geral',
        treatmentSummary: 'Limpeza',
        totalCommissionCents: 5000,
        rows: [
          {
            id: 'r3',
            paidAt: '2026-06-20',
            patientName: 'Ana',
            treatmentName: 'Limpeza',
            paidValueCents: 20000,
            treatmentCostCents: 15000,
            installment: null,
            commissionCents: 5000,
          },
        ],
      },
    ],
  },
  {
    professionalId: 'prof-3',
    professionalName: 'Sem regra',
    totalCents: 0,
    hasCommissionConfigured: false,
    ruleGroups: [],
  },
];

const historyFixture: CommissionSummaryRow[] = [
  {
    professionalId: 'prof-1',
    professionalName: 'Danillo',
    totalCents: 45000,
    paidAt: '2026-07-01',
    paidValueCents: 45000,
    hasCommissionConfigured: true,
    ruleGroups: [],
  },
  {
    professionalId: 'prof-2',
    professionalName: 'Fernanda',
    totalCents: 20000,
    paidAt: '2026-06-10',
    paidValueCents: 20000,
    hasCommissionConfigured: true,
    ruleGroups: [],
  },
];

describe('resolveCommissionPeriodDates', () => {
  it('resolve intervalo custom quando ambas as datas existem', () => {
    const range = resolveCommissionPeriodDates(
      'custom',
      new Date(2026, 6, 1),
      new Date(2026, 6, 15),
    );
    expect(range).toEqual({ startDate: '2026-07-01', endDate: '2026-07-15' });
  });

  it('fallback para hoje quando custom sem datas', () => {
    const range = resolveCommissionPeriodDates('custom');
    expect(range.startDate).toBe(range.endDate);
    expect(range.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('filterOpenCommissionsByPeriod', () => {
  it('filtra treatment rows no intervalo custom e recalcula totais', () => {
    const filtered = filterOpenCommissionsByPeriod(openFixture, {
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    });

    expect(filtered.filter((r) => r.hasCommissionConfigured)).toHaveLength(1);
    expect(filtered[0].professionalId).toBe('prof-1');
    expect(filtered[0].ruleGroups).toHaveLength(1);
    expect(filtered[0].ruleGroups[0].id).toBe('g1');
    expect(filtered[0].totalCents).toBe(20000);
  });

  it('omite profissional sem linhas no período', () => {
    const filtered = filterOpenCommissionsByPeriod(openFixture, {
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    });
    expect(filtered.some((r) => r.professionalId === 'prof-2')).toBe(false);
  });

  it('mantém profissional sem comissão configurada mesmo sem linhas no período', () => {
    const filtered = filterOpenCommissionsByPeriod(openFixture, {
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    });
    const unconfigured = filtered.find((r) => r.professionalId === 'prof-3');
    expect(unconfigured).toBeDefined();
    expect(unconfigured?.hasCommissionConfigured).toBe(false);
    expect(unconfigured?.totalCents).toBe(0);
  });
});

describe('filterHistoryCommissionsByPeriod', () => {
  it('filtra pelo paidAt do pagamento', () => {
    const filtered = filterHistoryCommissionsByPeriod(historyFixture, {
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].professionalId).toBe('prof-1');
  });
});

describe('filterCommissionRowByPeriod', () => {
  it('filtra grupos da linha para o modal de detalhes', () => {
    const filtered = filterCommissionRowByPeriod(openFixture[0], {
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    });
    expect(filtered.ruleGroups).toHaveLength(1);
    expect(filtered.totalCents).toBe(20000);
  });
});
