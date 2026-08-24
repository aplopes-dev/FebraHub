import { describe, expect, it } from 'vitest';
import type { ReportOpenTreatmentsWithoutAppointmentRow } from '../types/clinic-reports';
import {
  buildReportsOpenTreatmentsPdf,
  buildReportsOpenTreatmentsPdfFileName,
} from './build-reports-open-treatments-pdf';

const SAMPLE_ROWS: ReportOpenTreatmentsWithoutAppointmentRow[] = [
  {
    id: 'p1',
    patientName: 'Ana Carolina Silva',
    phone: '7332334455',
    mobile: '73999887766',
    document: '52998224725',
  },
  {
    id: 'p2',
    patientName: 'Bruno Henrique Santos',
    phone: '',
    mobile: '73988776655',
    document: '39053344705',
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

describe('buildReportsOpenTreatmentsPdf', () => {
  it('builds pdf blob with clinic header and file name', async () => {
    const generatedAt = new Date('2026-07-23T12:00:00.000Z');
    const blob = await buildReportsOpenTreatmentsPdf({
      rows: SAMPLE_ROWS,
      clinic: SAMPLE_CLINIC,
      generatedAt,
    });

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
    expect(blob.type).toBe('application/pdf');
    expect(buildReportsOpenTreatmentsPdfFileName(generatedAt)).toContain(
      'relatorio-procedimentos-abertos-sem-consulta',
    );
  });

  it('builds empty-state pdf', async () => {
    const blob = await buildReportsOpenTreatmentsPdf({
      rows: [],
      clinic: SAMPLE_CLINIC,
      generatedAt: new Date('2026-07-23T12:00:00.000Z'),
    });

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
  });
});
