import { describe, expect, it } from 'vitest';
import type { ReportExcludedRevenueRow } from '../types/clinic-reports';
import {
  buildReportsExcludedRevenuesPdf,
  buildReportsExcludedRevenuesPdfFileName,
} from './build-reports-excluded-revenues-pdf';

const SAMPLE_ROWS: ReportExcludedRevenueRow[] = [
  {
    id: 'e1',
    patientName: 'Ana Carolina Silva',
    description: 'Recebimento duplicado — consulta de retorno',
    valueCents: 18000,
    excludedAt: '2026-07-18',
    excludedBy: 'Não informado',
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

describe('buildReportsExcludedRevenuesPdf', () => {
  it('builds pdf blob with clinic header and file name', async () => {
    const generatedAt = new Date('2026-07-23T12:00:00.000Z');
    const blob = await buildReportsExcludedRevenuesPdf({
      rows: SAMPLE_ROWS,
      periodLabel: '08/2026',
      clinic: SAMPLE_CLINIC,
      generatedAt,
    });

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
    expect(blob.type).toBe('application/pdf');
    expect(buildReportsExcludedRevenuesPdfFileName(generatedAt)).toContain(
      'relatorio-receitas-excluidas',
    );
  });

  it('builds empty-state pdf', async () => {
    const blob = await buildReportsExcludedRevenuesPdf({
      rows: [],
      periodLabel: '19/07/2026 a 18/08/2026',
      clinic: SAMPLE_CLINIC,
      generatedAt: new Date('2026-07-23T12:00:00.000Z'),
    });

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
  });
});
