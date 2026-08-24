import { describe, expect, it } from 'vitest';
import type { ReportBirthdayRow } from '../types/clinic-reports';
import {
  buildReportsBirthdaysPdf,
  buildReportsBirthdaysPdfFileName,
} from './build-reports-birthdays-pdf';

const SAMPLE_ROWS: ReportBirthdayRow[] = [
  {
    id: 'p1',
    patientName: 'Ana Carolina Silva',
    phone: '7332334455',
    birthDate: '1985-07-17',
    mobile: '73999887766',
  },
  {
    id: 'p2',
    patientName: 'Bruno Henrique Santos',
    phone: '',
    birthDate: '1992-07-25',
    mobile: '73988776655',
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

describe('buildReportsBirthdaysPdf', () => {
  it('builds pdf blob with clinic header and file name', async () => {
    const generatedAt = new Date('2026-07-23T12:00:00.000Z');
    const blob = await buildReportsBirthdaysPdf({
      rows: SAMPLE_ROWS,
      periodLabel: '08/2026',
      clinic: SAMPLE_CLINIC,
      generatedAt,
    });

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
    expect(blob.type).toBe('application/pdf');
    expect(buildReportsBirthdaysPdfFileName(generatedAt)).toContain(
      'relatorio-aniversariantes',
    );
  });

  it('builds empty-state pdf', async () => {
    const blob = await buildReportsBirthdaysPdf({
      rows: [],
      periodLabel: '18/08/2026',
      clinic: SAMPLE_CLINIC,
      generatedAt: new Date('2026-07-23T12:00:00.000Z'),
    });

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
  });
});
