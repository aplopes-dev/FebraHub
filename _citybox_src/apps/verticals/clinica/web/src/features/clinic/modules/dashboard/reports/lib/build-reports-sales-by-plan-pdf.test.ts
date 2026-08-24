import { describe, expect, it } from 'vitest';
import type { ReportSalesByPlanRow } from '../types/clinic-reports';
import {
  buildReportsSalesByPlanPdf,
  buildReportsSalesByPlanPdfFileName,
} from './build-reports-sales-by-plan-pdf';

const SAMPLE_ROWS: ReportSalesByPlanRow[] = [
  {
    id: 'i1',
    planName: 'Ortodontia',
    saleDate: '2026-07-18',
    patientName: 'Ana Carolina Silva',
    treatmentName: 'Aparelho ortodôntico fixo',
    valueCents: 320000,
  },
];

const SAMPLE_CLINIC = {
  clinicName: 'Clínica Exemplo',
  communicationsName: 'Citybox Clinic',
  cnpj: '04.252.011/0001-10',
  phone: '7332334455',
  mobile: '73999887766',
  email: 'contato@exemplo.com',
  addressLine: 'Rua das Flores, 100 · Centro - Ilhéus - BA · CEP 45650-000',
  responsible: 'Dra. Maria Silva',
};

describe('buildReportsSalesByPlanPdf', () => {
  it('builds pdf blob with clinic header and file name', async () => {
    const generatedAt = new Date('2026-07-23T12:00:00.000Z');
    const blob = await buildReportsSalesByPlanPdf({
      rows: SAMPLE_ROWS,
      periodLabel: 'Mensal Julho/2026',
      clinic: SAMPLE_CLINIC,
      generatedAt,
    });

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
    expect(blob.type).toBe('application/pdf');
    expect(buildReportsSalesByPlanPdfFileName(generatedAt)).toContain(
      'relatorio-vendas-por-plano',
    );
  });

  it('builds empty-state pdf', async () => {
    const blob = await buildReportsSalesByPlanPdf({
      rows: [],
      periodLabel: 'Anual 2026',
      clinic: SAMPLE_CLINIC,
      generatedAt: new Date('2026-07-23T12:00:00.000Z'),
    });

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
  });
});
