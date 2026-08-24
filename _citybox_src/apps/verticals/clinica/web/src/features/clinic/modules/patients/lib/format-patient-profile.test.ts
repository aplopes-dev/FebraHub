import { describe, expect, it } from 'vitest';
import { formatPatientPlanLabel } from './format-patient-profile';

describe('formatPatientPlanLabel', () => {
  it('returns dash for empty plan name', () => {
    expect(formatPatientPlanLabel('')).toBe('—');
  });

  it('returns plan name when active or unknown status', () => {
    expect(formatPatientPlanLabel('Particular', 'active')).toBe('Particular');
    expect(formatPatientPlanLabel('Particular', null)).toBe('Particular');
    expect(formatPatientPlanLabel('Particular')).toBe('Particular');
  });

  it('appends (Inativo) when plan status is inactive', () => {
    expect(formatPatientPlanLabel('Particular', 'inactive')).toBe(
      'Particular (Inativo)',
    );
  });
});
