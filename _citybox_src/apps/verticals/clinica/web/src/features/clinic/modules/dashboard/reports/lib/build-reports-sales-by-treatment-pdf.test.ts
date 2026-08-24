import { describe, expect, it } from 'vitest';
import type { ReportSalesByTreatmentRow } from '../types/clinic-reports';
import {
  buildReportsSalesByTreatmentPdf,
  buildReportsSalesByTreatmentPdfFileName,
} from './build-reports-sales-by-treatment-pdf';

const SAMPLE_ROWS: ReportSalesByTreatmentRow[] = [
  {
    id: 'i1',
    treatmentName: 'Aparelho ortodôntico fixo',
    saleDate: '2026-07-18',
    patientName: 'Ana Carolina Silva',
    planName: 'Ortodontia',
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

describe('buildReportsSalesByTreatmentPdf', () => {
  it('builds pdf blob with clinic header and file name', async () => {
    const generatedAt = new Date('2026-07-23T12:00:00.000Z');
    const blob = await buildReportsSalesByTreatmentPdf({
      rows: SAMPLE_ROWS,
      periodLabel: 'Mensal Julho/2026',
      clinic: SAMPLE_CLINIC,
      generatedAt,
    });

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
    expect(blob.type).toBe('application/pdf');
    expect(buildReportsSalesByTreatmentPdfFileName(generatedAt)).toContain(
      'relatorio-vendas-por-procedimento',
    );
  });

  it('builds empty-state pdf', async () => {
    const blob = await buildReportsSalesByTreatmentPdf({
      rows: [],
      periodLabel: 'Anual 2026',
      clinic: SAMPLE_CLINIC,
      generatedAt: new Date('2026-07-23T12:00:00.000Z'),
    });

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
  });
});
