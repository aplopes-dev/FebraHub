import { describe, expect, it } from 'vitest';
import {
  buildCommissionReportPdf,
  buildCommissionReportPdfFileName,
} from './build-commission-report-pdf';
import type { CommissionSummaryRow } from '../types/commission-financial.types';

const fixture: CommissionSummaryRow = {
  professionalId: 'prof-1',
  professionalName: 'Danillo Mota',
  totalCents: 20000,
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
          patientName: 'Maria Oliveira',
          treatmentName: 'Extração',
          paidValueCents: 10000,
          treatmentCostCents: 8000,
          installment: '1/2',
          commissionCents: 20000,
        },
      ],
    },
  ],
};

describe('buildCommissionReportPdf', () => {
  it('gera um PDF não vazio', async () => {
    const blob = await buildCommissionReportPdf({
      row: fixture,
      mode: 'open',
      periodRange: { startDate: '2026-07-01', endDate: '2026-07-31' },
    });

    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(0);
  });
});

describe('buildCommissionReportPdfFileName', () => {
  it('monta nome com slug e período', () => {
    expect(
      buildCommissionReportPdfFileName('Danillo Mota', {
        startDate: '2026-07-01',
        endDate: '2026-07-31',
      }),
    ).toBe('comissoes-danillo-mota-2026-07-01-2026-07-31.pdf');
  });
});
