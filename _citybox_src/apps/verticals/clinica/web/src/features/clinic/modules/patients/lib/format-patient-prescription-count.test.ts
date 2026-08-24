import { describe, expect, it } from 'vitest';
import { formatPatientPrescriptionCount } from './format-patient-prescription-count';

describe('formatPatientPrescriptionCount', () => {
  it('formats singular count', () => {
    expect(formatPatientPrescriptionCount(1)).toBe('1 Receituário');
  });

  it('formats plural count', () => {
    expect(formatPatientPrescriptionCount(3)).toBe('3 Receituários');
  });
});
