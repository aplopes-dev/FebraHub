import { describe, expect, it } from 'vitest';
import type { ReportBudgetRow } from '../types/clinic-reports';
import {
  buildReportsOpenBudgetsPdf,
  buildReportsOpenBudgetsPdfFileName,
} from './build-reports-open-budgets-pdf';

const SAMPLE_ROWS: ReportBudgetRow[] = [
  {
    id: 'b1',
    budgetDate: '2026-07-10',
    patientName: 'Ana Carolina Silva',
    document: '52998224725',
    mobile: '73999887766',
    email: 'ana.silva@email.com',
    responsibleMobile: '73991112233',
    description: 'Consulta de avaliação',
    status: 'pending',
    valueCents: 18000,
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

describe('buildReportsOpenBudgetsPdf', () => {
  it('builds pdf blob with clinic header and file name', async () => {
    const generatedAt = new Date('2026-07-23T12:00:00.000Z');
    const blob = await buildReportsOpenBudgetsPdf({
      rows: SAMPLE_ROWS,
      periodLabel: 'Mensal Julho/2026',
      clinic: SAMPLE_CLINIC,
      generatedAt,
    });

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
    expect(blob.type).toBe('application/pdf');
    expect(buildReportsOpenBudgetsPdfFileName(generatedAt)).toContain(
      'relatorio-orcamentos-em-aberto',
    );
  });

  it('builds empty-state pdf', async () => {
    const blob = await buildReportsOpenBudgetsPdf({
      rows: [],
      periodLabel: 'Anual 2026',
      clinic: SAMPLE_CLINIC,
      generatedAt: new Date('2026-07-23T12:00:00.000Z'),
    });

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
  });
});
