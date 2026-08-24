import { describe, expect, it } from 'vitest';
import {
  formatPatientPrescriptionHistoryDescription,
  formatPatientPrescriptionHistoryTitle,
} from './format-patient-prescription-history';

describe('formatPatientPrescriptionHistory', () => {
  it('formats title with medication count and prescription date', () => {
    expect(formatPatientPrescriptionHistoryTitle(3, '2026-07-01')).toBe(
      '3 medicamentos — 01/07/2026',
    );
    expect(formatPatientPrescriptionHistoryTitle(1, '2026-07-01')).toBe(
      '1 medicamento — 01/07/2026',
    );
  });

  it('formats description with professional and issued datetime', () => {
    expect(
      formatPatientPrescriptionHistoryDescription(
        'Danillo Mota',
        '2026-07-01T13:25:00.000Z',
      ),
    ).toMatch(/^Danillo Mota — 01\/07\/2026 às \d{2}:\d{2}$/);
  });
});
