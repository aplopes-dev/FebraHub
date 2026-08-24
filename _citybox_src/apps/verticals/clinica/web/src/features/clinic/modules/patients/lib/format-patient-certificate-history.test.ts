import { describe, expect, it } from 'vitest';
import {
  formatPatientCertificateHistoryDescription,
  formatPatientCertificateHistoryTitle,
} from './format-patient-certificate-history';

describe('formatPatientCertificateHistoryTitle', () => {
  it('formats days certificate title', () => {
    expect(
      formatPatientCertificateHistoryTitle({
        type: 'days',
        daysCount: '3',
        issuedDate: '2026-07-01',
      }),
    ).toBe('Atestado de 3 dia(s) — 01/07/2026');
  });

  it('formats attendance certificate title', () => {
    expect(
      formatPatientCertificateHistoryTitle({
        type: 'attendance',
        daysCount: '',
        issuedDate: '2026-07-01',
      }),
    ).toBe('Presença na consulta — 01/07/2026');
  });
});

describe('formatPatientCertificateHistoryDescription', () => {
  it('includes professional name and issued timestamp', () => {
    const description = formatPatientCertificateHistoryDescription(
      'Danillo Mota',
      '2026-07-01T10:54:00',
    );

    expect(description).toBe('Danillo Mota — 01/07/2026 às 10:54');
  });
});
